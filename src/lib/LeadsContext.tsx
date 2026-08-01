import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lead, LeadFormInput, Stage } from './types';
import { createLead, deleteLead, listLeads, updateLead } from './api';
import type { Filters } from '../components/FilterBar';
import { useToast } from './toast';

const EMPTY_FILTERS: Filters = { search: '', stage: '', priority: '', source: '' };

interface LeadsContextValue {
  leads: Lead[];
  loading: boolean;
  loadError: string | null;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  refresh: () => Promise<void>;
  handleCreate: (input: LeadFormInput) => Promise<void>;
  handleUpdate: (id: string, input: LeadFormInput) => Promise<Lead>;
  handleDelete: (lead: Lead) => Promise<void>;
  handleStageChange: (lead: Lead, stage: Stage) => Promise<void>;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { leads } = await listLeads(filters);
      setLeads(leads);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounce so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [refresh]);

  async function handleCreate(input: LeadFormInput) {
    const { lead } = await createLead(input);
    setLeads((prev) => [lead, ...prev]);
    toast(`${lead.name} added — scored ${lead.score}/100 (${lead.priority.toUpperCase()})`, 'success');
  }

  async function handleUpdate(id: string, input: LeadFormInput): Promise<Lead> {
    const { lead } = await updateLead(id, input);
    setLeads((prev) => prev.map((l) => (l.id === id ? lead : l)));
    toast(`${lead.name} updated`, 'success');
    return lead;
  }

  async function handleDelete(lead: Lead) {
    await deleteLead(lead.id);
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    toast(`${lead.name} deleted`, 'info');
  }

  async function handleStageChange(lead: Lead, stage: Stage) {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage } : l)));
    try {
      const { lead: updated } = await updateLead(lead.id, { stage });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    } catch (err) {
      toast(`Couldn't move ${lead.name}: ${(err as Error).message}`, 'error');
      refresh();
    }
  }

  return (
    <LeadsContext.Provider
      value={{ leads, loading, loadError, filters, setFilters, refresh, handleCreate, handleUpdate, handleDelete, handleStageChange }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeads must be used within LeadsProvider');
  return ctx;
}
