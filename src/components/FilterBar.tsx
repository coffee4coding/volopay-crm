import { X } from 'lucide-react';
import { PRIORITIES, SOURCES, STAGES } from '../lib/types';

export interface Filters {
  search: string;
  stage: string;
  priority: string;
  source: string;
}

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm transition-colors hover:border-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <select value={filters.stage} onChange={(e) => onChange({ ...filters, stage: e.target.value })} className={selectClass}>
        <option value="">All stages</option>
        {STAGES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <select value={filters.priority} onChange={(e) => onChange({ ...filters, priority: e.target.value })} className={selectClass}>
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <select value={filters.source} onChange={(e) => onChange({ ...filters, source: e.target.value })} className={selectClass}>
        <option value="">All sources</option>
        {SOURCES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {(filters.search || filters.stage || filters.priority || filters.source) && (
        <button
          onClick={() => onChange({ search: '', stage: '', priority: '', source: '' })}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );
}
