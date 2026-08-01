import { createClient, type WebSocketLikeConstructor } from '@supabase/supabase-js';

// supabase-js always constructs a RealtimeClient, even though these handlers
// never open a channel — its constructor eagerly probes for a global
// WebSocket and throws if none exists (true on Node runtimes below 22,
// including Vercel deployments that don't have Node 22 pinned). Passing a
// transport stub short-circuits that probe; it's never actually
// instantiated since nothing here calls realtime.channel()/.connect().
class UnusedRealtimeTransport {}

// Server-side only client, uses the service_role key so it can bypass RLS.
// Never import this file from client code — it must only run inside /api.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    realtime: { transport: UnusedRealtimeTransport as unknown as WebSocketLikeConstructor },
  });
}
