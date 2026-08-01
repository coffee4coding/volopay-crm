import { createClient } from '@supabase/supabase-js';

// Server-side only client, uses the service_role key so it can bypass RLS.
// Never import this file from client code — it must only run inside /api.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
