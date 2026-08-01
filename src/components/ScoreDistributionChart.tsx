import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Lead } from '../lib/types';

const COLORS: Record<'Hot' | 'Warm' | 'Cold', string> = {
  Hot: '#10B981',
  Warm: '#F59E0B',
  Cold: '#EF4444',
};

export function ScoreDistributionChart({ leads }: { leads: Lead[] }) {
  const data = [
    { name: 'Hot' as const, value: leads.filter((l) => l.priority === 'hot').length },
    { name: 'Warm' as const, value: leads.filter((l) => l.priority === 'warm').length },
    { name: 'Cold' as const, value: leads.filter((l) => l.priority === 'cold').length },
  ];
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Score distribution</h2>
      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
              {data.map((d) => (
                <Cell key={d.name} fill={COLORS[d.name]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No leads yet</div>
      )}
    </div>
  );
}
