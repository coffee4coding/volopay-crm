import { Flame, Gauge, Trophy, Users } from 'lucide-react';
import { useLeads } from '../lib/LeadsContext';
import { StatCard } from '../components/StatCard';
import { ScoreDistributionChart } from '../components/ScoreDistributionChart';
import { ActivityFeed } from '../components/ActivityFeed';
import { PageTransition } from '../components/PageTransition';

export function DashboardPage() {
  const { leads } = useLeads();

  const total = leads.length;
  const hot = leads.filter((l) => l.priority === 'hot').length;
  const avgScore = total ? Math.round(leads.reduce((s, l) => s + l.score, 0) / total) : 0;
  const won = leads.filter((l) => l.stage === 'won').length;
  const conversionRate = total ? Math.round((won / total) * 100) : 0;

  return (
    <PageTransition>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard index={0} label="Total leads" value={total} icon={Users} iconBg="bg-accent/10" iconColor="text-accent" />
        <StatCard index={1} label="Hot leads" value={hot} icon={Flame} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard index={2} label="Avg. score" value={avgScore} suffix="/100" icon={Gauge} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard index={3} label="Conversion rate" value={conversionRate} suffix="%" icon={Trophy} iconBg="bg-violet-50" iconColor="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScoreDistributionChart leads={leads} />
        </div>
        <div>
          <ActivityFeed leads={leads} />
        </div>
      </div>
    </PageTransition>
  );
}
