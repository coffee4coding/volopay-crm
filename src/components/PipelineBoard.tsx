import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Lead, Stage } from '../lib/types';
import { STAGES } from '../lib/types';
import { PriorityBadge } from './Badges';

const PRIORITY_BORDER: Record<Lead['priority'], string> = {
  hot: 'border-l-emerald-500',
  warm: 'border-l-amber-500',
  cold: 'border-l-red-500',
};

export function PipelineBoard({
  leads,
  onView,
  onStageChange,
}: {
  leads: Lead[];
  onView: (lead: Lead) => void;
  onStageChange: (lead: Lead, stage: Stage) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  function handleDrop(stage: Stage) {
    setDragOverStage(null);
    if (!dragId) return;
    const lead = leads.find((l) => l.id === dragId);
    if (lead && lead.stage !== stage) onStageChange(lead, stage);
    setDragId(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage === stage.value);
        const isOver = dragOverStage === stage.value;
        return (
          <div
            key={stage.value}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage.value);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage.value ? null : s))}
            onDrop={() => handleDrop(stage.value)}
            className={`flex w-64 flex-shrink-0 flex-col rounded-xl border bg-slate-50 shadow-sm transition-colors ${
              isOver ? 'border-accent/40 bg-accent/5' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{stage.label}</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {stageLeads.length}
              </span>
            </div>
            <div className="flex min-h-[80px] flex-col gap-2 p-2">
              {stageLeads.map((lead) => (
                <motion.div
                  layout
                  key={lead.id}
                  draggable
                  onDragStart={() => setDragId(lead.id)}
                  onClick={() => onView(lead)}
                  className={`cursor-grab select-none rounded-md border-l-4 bg-white p-2.5 text-sm shadow-sm transition-shadow hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${PRIORITY_BORDER[lead.priority]}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">{lead.name}</div>
                      <div className="truncate text-xs text-slate-500">{lead.company || '—'}</div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">{lead.score}</span>
                  </div>
                  <div className="mt-2">
                    <PriorityBadge priority={lead.priority} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
