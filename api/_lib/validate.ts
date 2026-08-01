import type { CompanySize, Engagement, Source, Stage, Timeline } from './scoring.js';

const COMPANY_SIZES: CompanySize[] = ['1-10', '11-50', '51-200', '201-1000', '1000+', 'unknown'];
const SOURCES: Source[] = ['website', 'referral', 'cold_outreach', 'event', 'social', 'other'];
const TIMELINES: Timeline[] = ['immediate', '1_3_months', '3_6_months', '6_plus_months', 'not_sure'];
const ENGAGEMENTS: Engagement[] = ['high', 'medium', 'low'];
const STAGES: Stage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

function pickEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  const v = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_') as T;
  return allowed.includes(v) ? v : fallback;
}

export interface NormalizedLead {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  company_size: CompanySize;
  source: Source;
  budget: number | null;
  timeline: Timeline;
  engagement_level: Engagement;
  decision_maker: boolean;
  pain_points: string | null;
  notes: string | null;
  stage: Stage;
}

export class ValidationError extends Error {}

export function normalizeLeadInput(body: any): NormalizedLead {
  const name = String(body?.name ?? '').trim();
  if (!name) throw new ValidationError('name is required');

  const budgetRaw = body?.budget;
  const budget =
    budgetRaw === '' || budgetRaw === null || budgetRaw === undefined
      ? null
      : Number(budgetRaw);
  if (budget !== null && (Number.isNaN(budget) || budget < 0)) {
    throw new ValidationError('budget must be a non-negative number');
  }

  return {
    name,
    email: body?.email ? String(body.email).trim() : null,
    phone: body?.phone ? String(body.phone).trim() : null,
    company: body?.company ? String(body.company).trim() : null,
    industry: body?.industry ? String(body.industry).trim() : null,
    company_size: pickEnum(body?.company_size, COMPANY_SIZES, 'unknown'),
    source: pickEnum(body?.source, SOURCES, 'other'),
    budget,
    timeline: pickEnum(body?.timeline, TIMELINES, 'not_sure'),
    engagement_level: pickEnum(body?.engagement_level, ENGAGEMENTS, 'low'),
    decision_maker: Boolean(body?.decision_maker === true || body?.decision_maker === 'true' || body?.decision_maker === 'yes'),
    pain_points: body?.pain_points ? String(body.pain_points).trim() : null,
    notes: body?.notes ? String(body.notes).trim() : null,
    stage: pickEnum(body?.stage, STAGES, 'new'),
  };
}

export { COMPANY_SIZES, SOURCES, TIMELINES, ENGAGEMENTS, STAGES };
