import type { ApiRequest, ApiResponse } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { scoreLead } from '../_lib/scoring';
import { normalizeLeadInput, ValidationError } from '../_lib/validate';
import { requireAuth } from '../_lib/auth';
import { serverError } from '../_lib/errors';

// Expects { rows: Array<Record<string, unknown>> } — the CSV is parsed to
// JSON objects client-side (papaparse) and posted here as plain rows keyed
// by the same field names as the manual lead form (name, company, email, ...).
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!(await requireAuth(req, res))) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows must be a non-empty array' });
  }
  if (rows.length > 500) {
    return res.status(400).json({ error: 'Max 500 rows per import' });
  }

  const db = supabaseAdmin();
  const toInsert: Record<string, unknown>[] = [];
  const rowErrors: { row: number; error: string }[] = [];

  rows.forEach((raw, i) => {
    try {
      const lead = normalizeLeadInput(raw);
      const ai = scoreLead(lead);
      toInsert.push({ ...lead, ...ai });
    } catch (err) {
      rowErrors.push({ row: i + 1, error: err instanceof ValidationError ? err.message : 'Invalid row' });
    }
  });

  let inserted: unknown[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await db.from('leads').insert(toInsert).select();
    if (error) return serverError(res, error, 'POST /api/leads/import');
    inserted = data ?? [];
  }

  return res.status(200).json({ inserted: inserted.length, errors: rowErrors });
}
