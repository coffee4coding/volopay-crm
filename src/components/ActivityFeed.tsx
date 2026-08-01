import { Plus, RefreshCw } from 'lucide-react';
import type { Lead } from '../lib/types';

// There's no dedicated activity/events log — this is derived from the leads
// themselves (sorted by updated_at), not a true per-action audit trail.
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ leads }: { leads: Lead[] }) {
  const recent = [...leads]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent activity</h2>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-400">No activity yet</p>
      ) : (
        <ul className="space-y-3">
          {recent.map((lead) => {
            const wasAdded = Math.abs(new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) < 5000;
            const Icon = wasAdded ? Plus : RefreshCw;
            return (
              <li key={lead.id} className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${wasAdded ? 'bg-emerald-50 text-emerald-600' : 'bg-accent/10 text-accent'}`}>
                  <Icon size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-700">
                    <span className="font-medium">{lead.name}</span> was {wasAdded ? 'added' : 'updated'}
                  </p>
                  <p className="text-xs text-slate-400">{relativeTime(lead.updated_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
