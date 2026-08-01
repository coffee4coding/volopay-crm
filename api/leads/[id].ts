import type { ApiRequest, ApiResponse } from '../_lib/http';
import { supabaseAdmin } from '../_lib/supabaseAdmin';
import { scoreLead } from '../_lib/scoring';
import { normalizeLeadInput, ValidationError } from '../_lib/validate';
import { requireAuth } from '../_lib/auth';
import { serverError } from '../_lib/errors';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!(await requireAuth(req, res))) return;
  const db = supabaseAdmin();
  const id = String(req.query.id);

  if (req.method === 'GET') {
    const { data, error } = await db.from('leads').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Lead not found' });
    return res.status(200).json({ lead: data });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { data: existing, error: fetchError } = await db
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !existing) return res.status(404).json({ error: 'Lead not found' });

      // Merge incoming changes over the existing row so a partial PATCH
      // (e.g. just a stage change) still re-scores against full context.
      const merged = normalizeLeadInput({ ...existing, ...req.body });
      const ai = scoreLead(merged);

      const { data, error } = await db
        .from('leads')
        .update({ ...merged, ...ai })
        .eq('id', id)
        .select()
        .single();

      if (error) return serverError(res, error, 'PATCH /api/leads/:id');
      return res.status(200).json({ lead: data });
    } catch (err) {
      if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
      return serverError(res, err, 'PATCH /api/leads/:id');
    }
  }

  if (req.method === 'DELETE') {
    const { error } = await db.from('leads').delete().eq('id', id);
    if (error) return serverError(res, error, 'DELETE /api/leads/:id');
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
