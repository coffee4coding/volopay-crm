// Verifies the Supabase-issued JWT sent by the browser. Sign-up/sign-in
// happen client-side directly against Supabase Auth (see src/lib/auth.ts);
// this just confirms the bearer token on each request is a valid, current
// session before letting a handler touch the database.
import type { ApiRequest, ApiResponse } from './http.js';
import { supabaseAdmin } from './supabaseAdmin.js';

/** Returns true if authorized. Otherwise writes a 401 response and returns false. */
export async function requireAuth(req: ApiRequest, res: ApiResponse): Promise<boolean> {
  const raw = req.headers?.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}
