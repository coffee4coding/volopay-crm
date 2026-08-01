import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Lead } from '../lib/types';
import { PriorityBadge } from './Badges';

export function LeadDrawer({ lead, onClose, onEdit }: { lead: Lead; onClose: () => void; onEdit: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyMessage() {
    if (!lead.follow_up_message) return;
    navigator.clipboard.writeText(lead.follow_up_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{lead.name}</h2>
            <p className="text-sm text-slate-500">
              {lead.company || 'No company'} {lead.industry ? `· ${lead.industry}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-50"
            >
              Edit lead
            </button>
            <button onClick={onClose} className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
            <div>
              <div className="text-3xl font-bold text-slate-900">
                {lead.score}
                <span className="text-base font-normal text-slate-400">/100</span>
              </div>
              <div className="text-xs text-slate-500">AI lead score</div>
            </div>
            <PriorityBadge priority={lead.priority} />
          </div>

          {lead.score_breakdown && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Score breakdown</h3>
              <div className="space-y-2">
                {lead.score_breakdown.map((f) => (
                  <div key={f.factor}>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{f.factor} — {f.detail}</span>
                      <span className="tabular-nums">{f.points}/{f.max}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(f.points / f.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">AI reasoning</h3>
            <p className="text-sm text-slate-700">{lead.reasoning}</p>
          </div>

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended next action</h3>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{lead.next_action}</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Personalised follow-up message</h3>
              <button onClick={copyMessage} className="text-xs text-slate-500 underline transition-colors hover:text-slate-700">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="whitespace-pre-wrap rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {lead.follow_up_message}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
            <div className="text-slate-700"><span className="text-slate-500">Email:</span> {lead.email || '—'}</div>
            <div className="text-slate-700"><span className="text-slate-500">Phone:</span> {lead.phone || '—'}</div>
            <div className="text-slate-700"><span className="text-slate-500">Budget:</span> {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}</div>
            <div className="text-slate-700"><span className="text-slate-500">Source:</span> {lead.source.replace('_', ' ')}</div>
            {lead.pain_points && (
              <div className="col-span-2 text-slate-700"><span className="text-slate-500">Pain points:</span> {lead.pain_points}</div>
            )}
            {lead.notes && (
              <div className="col-span-2 text-slate-700"><span className="text-slate-500">Notes:</span> {lead.notes}</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
