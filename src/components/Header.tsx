import { Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLeads } from '../lib/LeadsContext';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/import': 'Import',
  '/pipeline': 'Pipeline',
  '/profile': 'Profile',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { filters, setFilters } = useLeads();
  const title = ROUTE_TITLES[location.pathname] ?? 'Lead CRM';

  function handleSearch(value: string) {
    setFilters({ ...filters, search: value });
    if (location.pathname !== '/leads') navigate('/leads');
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
      <h1 className="shrink-0 text-lg font-semibold text-slate-900">{title}</h1>
      <div className="relative w-full max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search leads by name, company, or email…"
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm transition-colors focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>
    </header>
  );
}
