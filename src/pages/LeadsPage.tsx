import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { Lead, LeadFormInput } from '../lib/types';
import { useLeads } from '../lib/LeadsContext';
import { FilterBar } from '../components/FilterBar';
import { LeadTable } from '../components/LeadTable';
import { LeadFormModal } from '../components/LeadFormModal';
import { LeadDrawer } from '../components/LeadDrawer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageTransition } from '../components/PageTransition';

export function LeadsPage() {
  const { leads, loading, loadError, filters, setFilters, handleCreate, handleUpdate, handleDelete, handleStageChange } = useLeads();

  const [showAdd, setShowAdd] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);

  async function onCreate(input: LeadFormInput) {
    await handleCreate(input);
    setShowAdd(false);
  }

  async function onUpdate(id: string, input: LeadFormInput) {
    const updated = await handleUpdate(id, input);
    setEditingLead(null);
    setViewingLead((v) => (v && v.id === id ? updated : v));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const lead = pendingDelete;
    setPendingDelete(null);
    await handleDelete(lead);
    if (viewingLead?.id === lead.id) setViewingLead(null);
  }

  return (
    <PageTransition>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[280px] flex-1">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
        >
          <Plus size={15} /> Add lead
        </button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Couldn't load leads: {loadError}</div>
      )}

      <LeadTable
        leads={leads}
        loading={loading}
        onView={setViewingLead}
        onEdit={setEditingLead}
        onDelete={setPendingDelete}
        onStageChange={handleStageChange}
        onAddLead={() => setShowAdd(true)}
      />

      {showAdd && <LeadFormModal onClose={() => setShowAdd(false)} onSubmit={onCreate} />}

      {editingLead && (
        <LeadFormModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSubmit={(input) => onUpdate(editingLead.id, input)}
        />
      )}

      <AnimatePresence>
        {viewingLead && (
          <LeadDrawer
            lead={viewingLead}
            onClose={() => setViewingLead(null)}
            onEdit={() => {
              setEditingLead(viewingLead);
              setViewingLead(null);
            }}
          />
        )}
      </AnimatePresence>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete lead?"
          description={`This permanently deletes "${pendingDelete.name}" and its AI scoring history. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </PageTransition>
  );
}
