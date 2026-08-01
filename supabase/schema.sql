-- AI Lead Qualification CRM — schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)

create extension if not exists "pgcrypto";

create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),

  -- Contact / firmographic details
  name              text not null,
  email             text,
  phone             text,
  company           text,
  industry          text,
  company_size      text        not null default 'unknown',   -- '1-10' | '11-50' | '51-200' | '201-1000' | '1000+' | 'unknown'
  source            text        not null default 'other',     -- 'website' | 'referral' | 'cold_outreach' | 'event' | 'social' | 'other'

  -- Qualification inputs (the signals the scoring engine reasons over)
  budget            numeric,                                  -- estimated deal value, in USD
  timeline          text        not null default 'not_sure',  -- 'immediate' | '1_3_months' | '3_6_months' | '6_plus_months' | 'not_sure'
  engagement_level  text        not null default 'low',        -- 'high' | 'medium' | 'low'
  decision_maker    boolean     not null default false,
  pain_points       text,
  notes             text,

  -- Pipeline state
  stage             text        not null default 'new',        -- 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

  -- AI qualification output (computed by the scoring engine, stored so it survives refresh)
  score             integer     not null default 0,            -- 0-100
  priority          text        not null default 'cold',       -- 'hot' | 'warm' | 'cold'
  reasoning         text,
  next_action       text,
  follow_up_message text,
  score_breakdown   jsonb,                                     -- factor-by-factor point breakdown, for transparency in the UI

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists leads_stage_idx on leads (stage);
create index if not exists leads_priority_idx on leads (priority);
create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_search_idx on leads using gin (
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(company,'') || ' ' || coalesce(email,''))
);

-- keep updated_at current on every write
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
before update on leads
for each row execute function set_updated_at();

-- RLS: API access goes through the server-side service_role key only (never the browser),
-- so we lock the table down and let the service role bypass RLS as usual.
alter table leads enable row level security;
