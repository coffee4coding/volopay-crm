// Rule-based AI qualification engine.
//
// No external LLM call is made — every signal a rep enters is run through a
// transparent, weighted model (0-100) and turned into a priority tier, a
// plain-English reasoning statement, a recommended next action, and a
// personalised follow-up message. Weights are tuned for a typical B2B ICP
// (mid/large companies, faster timelines, higher engagement, confirmed
// decision-makers score higher) and are the single place to retune the model.

export type Timeline = 'immediate' | '1_3_months' | '3_6_months' | '6_plus_months' | 'not_sure';
export type Engagement = 'high' | 'medium' | 'low';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+' | 'unknown';
export type Source = 'website' | 'referral' | 'cold_outreach' | 'event' | 'social' | 'other';
export type Stage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type Priority = 'hot' | 'warm' | 'cold';

export interface LeadInput {
  name: string;
  company?: string | null;
  industry?: string | null;
  company_size: CompanySize;
  source: Source;
  budget?: number | null;
  timeline: Timeline;
  engagement_level: Engagement;
  decision_maker: boolean;
  pain_points?: string | null;
  stage: Stage;
}

interface FactorScore {
  factor: string;
  points: number;
  max: number;
  detail: string;
}

const TIMELINE_POINTS: Record<Timeline, { points: number; label: string }> = {
  immediate: { points: 25, label: 'ready to buy immediately' },
  '1_3_months': { points: 18, label: 'planning to decide in 1-3 months' },
  '3_6_months': { points: 10, label: 'planning to decide in 3-6 months' },
  '6_plus_months': { points: 4, label: 'a 6+ month timeline' },
  not_sure: { points: 0, label: 'no clear timeline' },
};

const ENGAGEMENT_POINTS: Record<Engagement, { points: number; label: string }> = {
  high: { points: 20, label: 'high engagement (actively responding/interacting)' },
  medium: { points: 12, label: 'moderate engagement' },
  low: { points: 4, label: 'low engagement so far' },
};

const COMPANY_SIZE_POINTS: Record<CompanySize, { points: number; label: string }> = {
  '1000+': { points: 15, label: 'an enterprise-size company (1000+ employees)' },
  '201-1000': { points: 13, label: 'a large company (201-1000 employees)' },
  '51-200': { points: 10, label: 'a mid-size company (51-200 employees)' },
  '11-50': { points: 6, label: 'a small company (11-50 employees)' },
  '1-10': { points: 3, label: 'a very small company (1-10 employees)' },
  unknown: { points: 0, label: 'an unknown company size' },
};

function budgetScore(budget: number | null | undefined): FactorScore {
  const b = budget ?? 0;
  let points = 0;
  let label = 'no budget provided';
  if (b >= 100000) { points = 25; label = `a strong budget (~$${b.toLocaleString()})`; }
  else if (b >= 50000) { points = 20; label = `a solid budget (~$${b.toLocaleString()})`; }
  else if (b >= 20000) { points = 15; label = `a moderate budget (~$${b.toLocaleString()})`; }
  else if (b >= 5000) { points = 8; label = `a modest budget (~$${b.toLocaleString()})`; }
  else if (b > 0) { points = 3; label = `a small budget (~$${b.toLocaleString()})`; }
  return { factor: 'Budget', points, max: 25, detail: label };
}

export interface ScoringResult {
  score: number;
  priority: Priority;
  reasoning: string;
  next_action: string;
  follow_up_message: string;
  score_breakdown: FactorScore[];
}

export function scoreLead(lead: LeadInput): ScoringResult {
  const timeline = TIMELINE_POINTS[lead.timeline] ?? TIMELINE_POINTS.not_sure;
  const engagement = ENGAGEMENT_POINTS[lead.engagement_level] ?? ENGAGEMENT_POINTS.low;
  const size = COMPANY_SIZE_POINTS[lead.company_size] ?? COMPANY_SIZE_POINTS.unknown;
  const budget = budgetScore(lead.budget);
  const decisionMaker: FactorScore = lead.decision_maker
    ? { factor: 'Decision maker', points: 15, max: 15, detail: 'confirmed decision-maker' }
    : { factor: 'Decision maker', points: 3, max: 15, detail: 'not confirmed as the decision-maker' };

  const breakdown: FactorScore[] = [
    { factor: 'Timeline', points: timeline.points, max: 25, detail: timeline.label },
    budget,
    { factor: 'Engagement', points: engagement.points, max: 20, detail: engagement.label },
    decisionMaker,
    { factor: 'Company size', points: size.points, max: 15, detail: size.label },
  ];

  const score = Math.min(100, breakdown.reduce((sum, f) => sum + f.points, 0));

  const priority: Priority = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';

  // Reasoning: lead with the strongest and weakest factors, in plain English.
  const sorted = [...breakdown].sort((a, b) => (b.points / b.max) - (a.points / a.max));
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const reasoning =
    `Scored ${score}/100 (${priority.toUpperCase()}). ` +
    `Strongest signal: ${strongest.detail} (${strongest.points}/${strongest.max} pts). ` +
    `Weakest signal: ${weakest.detail} (${weakest.points}/${weakest.max} pts). ` +
    `${lead.decision_maker ? 'Confirmed decision-maker access is a strong buying signal.' : 'Decision-maker access is unconfirmed — validate this early.'} ` +
    `Overall this lead reflects ${timeline.label} and ${engagement.label}.`;

  const next_action = nextAction(priority, lead.stage);
  const follow_up_message = followUpMessage(lead, priority);

  return { score, priority, reasoning, next_action, follow_up_message, score_breakdown: breakdown };
}

function nextAction(priority: Priority, stage: Stage): string {
  if (stage === 'won') return 'Kick off onboarding and introduce the customer success team.';
  if (stage === 'lost') return 'Log the loss reason and revisit in 3-6 months if circumstances change.';
  if (stage === 'proposal' || stage === 'negotiation') {
    return priority === 'hot'
      ? 'Follow up on the proposal within 1 business day — this deal is close to closing.'
      : 'Follow up on the proposal within 3 business days; address any open objections.';
  }
  if (priority === 'hot') {
    return stage === 'new'
      ? 'Call within 24 hours — high-intent lead, respond before it goes cold.'
      : 'Prioritise scheduling a demo or proposal call this week.';
  }
  if (priority === 'warm') {
    return stage === 'new'
      ? 'Send a personalised email today, then follow up by phone within 2-3 days.'
      : 'Continue nurturing with relevant case studies and check in within a week.';
  }
  return 'Add to the nurture email sequence and re-evaluate in 30 days.';
}

function followUpMessage(lead: LeadInput, priority: Priority): string {
  const firstName = (lead.name || '').trim().split(/\s+/)[0] || 'there';
  const company = lead.company ? ` at ${lead.company}` : '';
  const pain = lead.pain_points?.trim();

  if (priority === 'hot') {
    return `Hi ${firstName}, thanks for your interest${company}! Based on what you've shared${pain ? ` about ${pain}` : ''}, I think we can make a real impact quickly. Do you have 15 minutes this week for a quick call to walk through next steps?`;
  }
  if (priority === 'warm') {
    return `Hi ${firstName}, great connecting with you${company}. ${pain ? `I hear that ${pain} is a priority for you — ` : ''}I'd love to share how we've helped similar teams. Would a short call sometime in the next couple of weeks work for you?`;
  }
  return `Hi ${firstName}, thanks for reaching out${company}. I'll follow up with some helpful resources${pain ? ` around ${pain}` : ''} in the meantime — feel free to reach out whenever the timing is right to talk further.`;
}
