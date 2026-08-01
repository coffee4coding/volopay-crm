import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSession, onAuthChange } from './lib/auth';
import { LoginScreen } from './components/LoginScreen';
import { AppLayout } from './layouts/AppLayout';
import { ToastProvider } from './lib/toast';

function AuthGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    getSession().then(({ data }) => setSession(data.session));
    return onAuthChange((_event, newSession) => setSession(newSession));
  }, []);

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <AppLayout />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthGate />
    </ToastProvider>
  );
}
