import type { Priority } from '../lib/types';

const PRIORITY_STYLES: Record<Priority, string> = {
  hot: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  warm: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  cold: 'bg-red-100 text-red-700 ring-red-600/20',
};

const PRIORITY_DOT: Record<Priority, string> = {
  hot: 'bg-emerald-500',
  warm: 'bg-amber-500',
  cold: 'bg-red-500',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${PRIORITY_STYLES[priority]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority]} ${priority === 'hot' ? 'animate-pulse' : ''}`} />
      {priority.toUpperCase()}
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  return <span className={`font-semibold tabular-nums ${color}`}>{score}</span>;
}
