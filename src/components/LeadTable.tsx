import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Pencil, Trash2, UserPlus } from 'lucide-react';
import type { Lead, Stage } from '../lib/types';
import { STAGES } from '../lib/types';
import { PriorityBadge, ScorePill } from './Badges';

const PRIORITY_BORDER: Record<Lead['priority'], string> = {
  hot: 'border-l-emerald-500',
  warm: 'border-l-amber-500',
  cold: 'border-l-red-500',
};

const PAGE_SIZE = 10;
type SortKey = 'score' | 'stage' | 'updated_at';

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100 last:border-0">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-slate-200" style={{ width: `${50 + ((i + j) % 4) * 12}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function IconButton({ onClick, label, tone, children }: { onClick: () => void; label: string; tone: 'default' | 'danger'; children: React.ReactNode }) {
  const toneClass =
    tone === 'danger'
      ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700';
  return (
    <button onClick={onClick} aria-label={label} title={label} className={`rounded-md p-1.5 transition-colors ${toneClass}`}>
      {children}
    </button>
  );
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  dir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-semibold text-slate-500 transition-colors hover:text-slate-700"
    >
      {label}
      {isActive ? (dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronDown size={13} className="opacity-0 group-hover:opacity-30" />}
    </button>
  );
}

export function LeadTable({
  leads,
  loading,
  onView,
  onEdit,
  onDelete,
  onStageChange,
  onAddLead,
}: {
  leads: Lead[];
  loading: boolean;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onStageChange: (lead: Lead, stage: Stage) => void;
  onAddLead?: () => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [leads]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return leads;
    const stageIndex = (s: Stage) => STAGES.findIndex((st) => st.value === s);
    const copy = [...leads];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'score') cmp = a.score - b.score;
      else if (sortKey === 'stage') cmp = stageIndex(a.stage) - stageIndex(b.stage);
      else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [leads, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageLeads = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="group border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Lead</th>
              <th className="px-4 py-3"><SortHeader label="Score" sortKey="score" activeKey={sortKey} dir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3"><SortHeader label="Stage" sortKey="stage" activeKey={sortKey} dir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3"><SortHeader label="Updated" sortKey="updated_at" activeKey={sortKey} dir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="rounded-full bg-accent/10 p-3">
                      <UserPlus size={22} className="text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">No leads yet</p>
                      <p className="text-sm text-slate-500">Add your first lead to see AI scoring in action.</p>
                    </div>
                    {onAddLead && (
                      <button
                        onClick={onAddLead}
                        className="mt-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md"
                      >
                        + Add lead
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              pageLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-b border-l-4 border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50 ${PRIORITY_BORDER[lead.priority]}`}
                >
                  <td className="cursor-pointer px-4 py-3" onClick={() => onView(lead)}>
                    <div className="font-medium text-slate-900">{lead.name}</div>
                    <div className="text-xs text-slate-500">{lead.company || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ScorePill score={lead.score} />
                    <span className="text-slate-400">/100</span>
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={lead.priority} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.stage}
                      onChange={(e) => onStageChange(lead, e.target.value as Stage)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs transition-colors hover:border-slate-300"
                    >
                      {STAGES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{lead.source.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(lead.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-0.5">
                      <IconButton onClick={() => onView(lead)} label="View" tone="default"><Eye size={15} /></IconButton>
                      <IconButton onClick={() => onEdit(lead)} label="Edit" tone="default"><Pencil size={15} /></IconButton>
                      <IconButton onClick={() => onDelete(lead)} label="Delete" tone="danger"><Trash2 size={15} /></IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && leads.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>
            Page {page} of {totalPages} · {leads.length} leads
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md p-1.5 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md p-1.5 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
