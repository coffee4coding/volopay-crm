import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { scoreLead } from '../_lib/scoring.js';
import { normalizeLeadInput, ValidationError } from '../_lib/validate.js';
import { requireAuth } from '../_lib/auth.js';
import { serverError } from '../_lib/errors.js';

const SORTABLE_COLUMNS = new Set(['created_at', 'updated_at', 'score', 'name', 'company', 'stage', 'priority']);

// PostgREST's `.or()` takes a raw filter string where `,` separates
// conditions and `()` nest them — strip those out of user input so a search
// term can't break out of the intended ilike clauses.
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()]/g, '').trim();
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!(await requireAuth(req, res))) return;
  const db = supabaseAdmin();

  if (req.method === 'GET') {
    const { search, stage, priority, source, sort, order = 'desc' } = req.query;

    let query = db.from('leads').select('*');

    if (typeof stage === 'string' && stage) query = query.eq('stage', stage);
    if (typeof priority === 'string' && priority) query = query.eq('priority', priority);
    if (typeof source === 'string' && source) query = query.eq('source', source);
    if (typeof search === 'string' && search.trim()) {
      const term = sanitizeSearchTerm(search);
      if (term) {
        query = query.or(`name.ilike.%${term}%,company.ilike.%${term}%,email.ilike.%${term}%`);
      }
    }

    const sortCol = typeof sort === 'string' && SORTABLE_COLUMNS.has(sort) ? sort : 'created_at';
    const ascending = order === 'asc';
    query = query.order(sortCol, { ascending });

    const { data, error } = await query;
    if (error) return serverError(res, error, 'GET /api/leads');
    return res.status(200).json({ leads: data });
  }

  if (req.method === 'POST') {
    try {
      const lead = normalizeLeadInput(req.body);
      const ai = scoreLead(lead);

      const { data, error } = await db
        .from('leads')
        .insert({ ...lead, ...ai })
        .select()
        .single();

      if (error) return serverError(res, error, 'POST /api/leads');
      return res.status(201).json({ lead: data });
    } catch (err) {
      if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
      return serverError(res, err, 'POST /api/leads');
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
