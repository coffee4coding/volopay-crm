import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Lead } from '../lib/types';
import { useLeads } from '../lib/LeadsContext';
import { PipelineBoard } from '../components/PipelineBoard';
import { LeadDrawer } from '../components/LeadDrawer';
import { LeadFormModal } from '../components/LeadFormModal';
import { PageTransition } from '../components/PageTransition';

export function PipelinePage() {
  const { leads, handleStageChange, handleUpdate } = useLeads();
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  return (
    <PageTransition>
      <PipelineBoard leads={leads} onView={setViewingLead} onStageChange={handleStageChange} />

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

      {editingLead && (
        <LeadFormModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSubmit={async (input) => {
            const updated = await handleUpdate(editingLead.id, input);
            setEditingLead(null);
            setViewingLead((v) => (v && v.id === updated.id ? updated : v));
          }}
        />
      )}
    </PageTransition>
  );
}
