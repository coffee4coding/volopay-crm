import { createClient } from '@supabase/supabase-js';

// Browser-side client — must only ever use the anon key. The anon key is
// designed to be public (it's paired with RLS), unlike the service_role key
// used server-side in api/_lib/supabaseAdmin.ts, which must never be given a
// VITE_ prefix or it would ship to every browser.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
