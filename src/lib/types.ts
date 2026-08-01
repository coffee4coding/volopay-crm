export type Timeline = 'immediate' | '1_3_months' | '3_6_months' | '6_plus_months' | 'not_sure';
export type Engagement = 'high' | 'medium' | 'low';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+' | 'unknown';
export type Source = 'website' | 'referral' | 'cold_outreach' | 'event' | 'social' | 'other';
export type Stage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type Priority = 'hot' | 'warm' | 'cold';

export interface ScoreFactor {
  factor: string;
  points: number;
  max: number;
  detail: string;
}

export interface Lead {
  id: string;
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
  score: number;
  priority: Priority;
  reasoning: string | null;
  next_action: string | null;
  follow_up_message: string | null;
  score_breakdown: ScoreFactor[] | null;
  created_at: string;
  updated_at: string;
}

export type LeadFormInput = Omit<
  Lead,
  'id' | 'score' | 'priority' | 'reasoning' | 'next_action' | 'follow_up_message' | 'score_breakdown' | 'created_at' | 'updated_at'
>;

export const STAGES: { value: Stage; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const SOURCES: { value: Source; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_outreach', label: 'Cold outreach' },
  { value: 'event', label: 'Event' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

export const TIMELINES: { value: Timeline; label: string }[] = [
  { value: 'not_sure', label: 'Not sure' },
  { value: 'immediate', label: 'Immediate' },
  { value: '1_3_months', label: '1-3 months' },
  { value: '3_6_months', label: '3-6 months' },
  { value: '6_plus_months', label: '6+ months' },
];

export const ENGAGEMENTS: { value: Engagement; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];
