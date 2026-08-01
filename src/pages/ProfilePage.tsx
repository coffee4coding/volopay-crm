import { LogOut } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { signOut } from '../lib/auth';
import { PageTransition } from '../components/PageTransition';

export function ProfilePage() {
  const user = useCurrentUser();
  const initial = (user?.email?.[0] || '?').toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <PageTransition>
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-2xl font-semibold text-accent">
            {initial}
          </div>
          <div>
            <p className="font-medium text-slate-900">{user?.email}</p>
            <p className="text-sm text-slate-500">Member since {memberSince}</p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </PageTransition>
  );
}
