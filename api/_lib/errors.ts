import type { ApiResponse } from './http';

// Logs the real error server-side but never echoes raw DB/driver error text
// (column names, constraint names, internal structure) back to the caller.
export function serverError(res: ApiResponse, err: unknown, context: string): void {
  console.error(`[${context}]`, err);
  res.status(500).json({ error: 'Internal server error' });
}
