# AI Lead Qualification CRM

Capture, score, and prioritise sales leads. Every lead is run through a
transparent, rule-based scoring engine (no external API calls) that produces
a 0-100 score, a Hot/Warm/Cold priority, plain-English reasoning, a
recommended next action, and a personalised follow-up message — all stored
in the database alongside the lead.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind (single page, no router)
- **Backend:** Vercel serverless functions (`/api/leads/*`)
- **Database:** Supabase (Postgres)
- **AI logic:** `api/_lib/scoring.ts` — a weighted multi-factor model (timeline,
  budget, engagement, decision-maker status, company size). See that file to
  retune weights or thresholds.

## How scoring works

Each lead earns points across 5 factors (100 max):

| Factor | Max points | Signal |
|---|---|---|
| Timeline | 25 | How soon they plan to buy |
| Budget | 25 | Estimated deal size |
| Engagement | 20 | How actively they're responding |
| Decision-maker | 15 | Confirmed buying authority |
| Company size | 15 | Fit against target company size |

Score ≥ 70 → **Hot**, 40-69 → **Warm**, < 40 → **Cold**. The reasoning,
next action, and follow-up message are generated from the same inputs, so
they always match the score.

## Access control

Every `/api` endpoint is gated by real per-user accounts via **Supabase
Auth** (email + password) — sign-up is open, so anyone who reaches the login
page can create an account. There's no multi-tenant data model: every
account sees the same shared `leads` table, so this only controls *who can
get in*, not who sees what once they're in. The browser signs in/up directly
against Supabase (`src/lib/auth.ts`, `src/lib/supabaseClient.ts`) and attaches
the resulting session's JWT as a bearer token on every API request
(`src/lib/api.ts`); the server verifies that token on each request via
`supabaseAdmin().auth.getUser()` (`api/_lib/auth.ts`). See `AUDIT_LOG.md` for
the history of this decision, including the earlier shared-password design it
replaced.

Two settings live in your Supabase project's dashboard, not in code:
- **Authentication → Providers → Email → "Confirm email"** — on (default)
  requires clicking an emailed link before sign-up grants a session; off logs
  the user in immediately after signing up.
- **Authentication → URL Configuration → Redirect URLs** — if "Confirm
  email" is on, this must include both `http://localhost:5173` and your
  deployed Vercel origin, or the confirmation link won't land back on a
  working page.

"Forgot password" isn't implemented yet — sign-up and sign-in only for now.

## Local development

Copy `.env.local.example` to `.env.local` and fill in your Supabase project's
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only, read by the API),
plus `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (bundled into the
frontend — the anon key is designed to be public and is what the browser uses
to talk to Supabase Auth directly). All four are in Project Settings → API in
your Supabase dashboard.

```bash
npm install
npm run dev:api      # API on http://localhost:3000 (reads .env.local)
npm run dev           # frontend on http://localhost:5173, proxies /api -> :3000
```

Run both in separate terminals, then open http://localhost:5173.
`dev-server.ts` is a thin Express wrapper around the exact same `/api/*`
handler functions Vercel runs in production — it exists purely so you don't
need `vercel login` to test locally.

## Database setup

Run `supabase/schema.sql` once in your Supabase project's SQL Editor. It
creates the `leads` table with the qualification fields, AI output columns,
and search indexes.

## Deployment (Vercel)

1. `vercel link` (first time) then set the env vars (all required — missing
   any of them makes every `/api` call fail, and the two `VITE_` vars must be
   set for every environment that runs a build, since Vite inlines them at
   build time, not request time):
   `vercel env add SUPABASE_URL production`
   `vercel env add SUPABASE_SERVICE_ROLE_KEY production`
   `vercel env add VITE_SUPABASE_URL production`
   `vercel env add VITE_SUPABASE_ANON_KEY production`
2. `vercel --prod`

## Using the app

- **Add a lead** — "+ Add lead" opens a form; on save the lead is scored
  immediately.
- **Import CSV** — "Import CSV" accepts a file with the columns listed in the
  in-app template download; every row is scored on import.
- **View AI results** — click any lead row to see its score breakdown,
  reasoning, next action, and a copy-ready follow-up message.
- **Edit / delete** — from the table row actions or the detail view. Editing
  re-runs the scoring engine automatically.
- **Change stage** — use the stage dropdown directly in the table row.
- **Search / filter** — the bar above the table filters by name/company/email
  text search, stage, priority, and source; combine them freely.
