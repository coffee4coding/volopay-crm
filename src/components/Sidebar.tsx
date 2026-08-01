import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Upload, LayoutGrid, LogOut, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { signOut } from '../lib/auth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/pipeline', label: 'Pipeline', icon: LayoutGrid },
];

function initialOf(email: string | undefined) {
  return (email?.[0] || '?').toUpperCase();
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const user = useCurrentUser();

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem('sidebar-collapsed', String(!c));
      return !c;
    });
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col bg-sidebar text-slate-300 transition-all duration-200 md:flex ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Sparkles size={18} className="text-white" />
          </div>
          {!collapsed && <span className="truncate text-sm font-semibold text-white">Lead CRM</span>}
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleCollapsed}
          className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5">
            <NavLink
              to="/profile"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-white/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/30 text-xs font-semibold text-white">
                {initialOf(user?.email)}
              </div>
              {!collapsed && <span className="truncate text-xs text-slate-300">{user?.email}</span>}
            </NavLink>
            <button
              onClick={() => signOut()}
              aria-label="Log out"
              title="Log out"
              className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-sidebar py-1.5 md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-white' : 'text-slate-400'
              }`
            }
          >
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-white' : 'text-slate-400'
            }`
          }
        >
          <div className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-accent/30 text-[9px] font-semibold text-white">
            {initialOf(user?.email)}
          </div>
          Profile
        </NavLink>
      </nav>
    </>
  );
}
