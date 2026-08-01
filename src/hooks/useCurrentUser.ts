import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSession, onAuthChange } from '../lib/auth';

export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return onAuthChange((_event, session) => setUser(session?.user ?? null));
  }, []);

  return user;
}
