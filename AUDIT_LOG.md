# AI Lead Qualification CRM — Audit Log

## 1. Requirements

Build a working AI-powered CRM: capture/qualify/prioritise leads, AI-generated
score + priority + reasoning + next action + follow-up message, persistent
database, search/filter/stage management, CRUD, a public live link, easy for
a teammate to use. Full brief in the original task prompt.

## 2. Key decisions

- **"AI" = a rule-based scoring engine, not an LLM call.** No LLM API key was
  available in the build environment, and a deterministic, explainable model
  (weighted factors → score → priority → reasoning → next action → message,
  see `api/_lib/scoring.ts`) is arguably a better fit for a scoring system a
  sales team needs to trust and audit anyway. User confirmed this approach.
- **Stack: React + Vite + TypeScript frontend, Vercel serverless functions
  for the API, Supabase (Postgres) for storage.** User is deploying and
  managing Vercel/Supabase/GitHub themselves; this session builds and
  security-hardens the code, verified against the user's real Supabase
  project via a local dev server, but does not deploy or push.
- **`dev-server.ts`** — a thin Express wrapper that mounts the exact same
  `/api/*` handler functions Vercel runs in production, so the app can be
  fully exercised locally (`npm run dev:api` + `npm run dev`) without
  `vercel login`/`vercel dev`.
- **Removed `@vercel/node` dependency.** It was only used for two type
  imports but pulled in a dev-tooling chain with 1 critical + 5 high CVEs
  (tar, undici, path-to-regexp) that never ship to the deployed function.
  Replaced with a minimal local `ApiRequest`/`ApiResponse` interface
  (`api/_lib/http.ts`) that both Vercel's real runtime and Express satisfy
  structurally.

## 3. Bugs / incidents hit and fixed

### 3.1 Secrets leaked into the tracked template file
**Symptom:** the user's real Supabase URL, anon key, and service_role key
ended up pasted into `.env.local.example` — the *tracked* template file, not
`.env.local` (which is gitignored).
**Cause:** user copy-pasted into the wrong file.
**Fix:** moved the real values into `.env.local` (`chmod 600`), reset
`.env.local.example` back to blank placeholders, confirmed `.gitignore`
excludes `.env`/`.env.local`, and grepped the whole tree for the leaked
project ref/JWT header to confirm no other copies existed.
**Verified:** `git status` showed no repo yet (nothing could have been
committed); post-fix grep across the tree returned no matches outside
`.env.local`.

### 3.2 Vercel CLI had live access to the user's account
**Symptom:** `vercel whoami` returned the user's real account
(`r4rahul2study-3845`) — a prior `vercel login` (run by the user per earlier
instructions) had left an authenticated session in this environment, which
the user then asked to have removed since they're managing Vercel
themselves.
**Fix:** `vercel logout`, then removed the local CLI config/cache
directories. Re-ran `vercel whoami` afterward to confirm it now starts a
fresh (uncompleted) login flow instead of returning an account.

### 3.3 No git repository — `/security-review` skill couldn't run
**Symptom:** the automated review skill requires a git repo; this directory
has none (by design — user is pushing to GitHub themselves later).
**Fix:** performed the review manually by re-reading the live source of
every `/api` handler rather than skipping it. Findings below.

### 3.4 Security findings (manual review, see section 4) — all fixed
Four issues found and fixed in this pass; see section 4 for detail and
section 5 for what remains a known limitation.

## 4. Security findings and fixes

| # | Finding | File | Severity | Fix |
|---|---|---|---|---|
| 1 | No authentication on any `/api/leads*` endpoint — anyone with the URL could read, edit, or delete all lead data once deployed | `api/leads/*.ts` | High | Added a shared-secret auth gate: `POST /api/auth/login` verifies a team password (`APP_PASSWORD` env var) with a timing-safe comparison and issues an HMAC-SHA256-signed, 30-day bearer token (`api/_lib/auth.ts`). Every `/api/leads*` handler now calls `requireAuth()` first and returns 401 without it. Frontend gates the whole app behind a `LoginScreen`, stores the token in `localStorage`, attaches it as `Authorization: Bearer <token>` on every request, and forces re-login on any 401 (`src/lib/auth.ts`, `src/lib/api.ts`, `src/App.tsx`). |
| 2 | Search filter injection — the `search` query param was spliced unescaped into a raw PostgREST `.or()` filter string; `,`/`)` in user input could break out of the intended clauses | `api/leads/index.ts` | Medium | Strip `,()` from the search term before interpolating (`sanitizeSearchTerm`). No practical cross-tenant impact today (single shared table, no per-tenant rows to leak) but was a real latent bug and bad practice regardless. |
| 3 | Raw Postgres/Supabase error messages returned to API callers, leaking internal column/constraint names on malformed requests | all `/api` handlers | Low–Medium | Added `api/_lib/errors.ts::serverError()` — logs the real error server-side via `console.error`, returns a generic `"Internal server error"` to the client. Applied to every DB-error branch; validation errors (our own messages) are still returned as-is since those are intentionally user-facing. |
| 4 | `sort` query param passed straight to `.order()` with no whitelist | `api/leads/index.ts` | Low | Whitelisted against the known sortable columns (`created_at`, `updated_at`, `score`, `name`, `company`, `stage`, `priority`); anything else falls back to `created_at`. |

**Verification:** ran a local end-to-end curl sequence against the real dev
server after the fix — unauthenticated request → 401; wrong password → 401
generic message; correct password → valid token issued; authenticated
request → 200; injection-style search payload → 200 with no query error;
bogus `sort` value → 200 with safe fallback, no leaked error; garbage bearer
token → 401. All passed.

## 5. What's a stub / known limitation

- **Auth is a single shared team password, not per-user accounts.** No
  roles, no audit trail of *who* changed a lead. Appropriate for a small
  internal team sharing one tool, not for a product with external users or a
  compliance requirement to attribute changes to individuals. Flagged to the
  user; upgrading to real per-user auth (e.g. Supabase Auth) would be the
  next step if that need arises.
- **No rate limiting** on any endpoint. Combined with the auth gate this is
  a low risk today (an attacker needs the password first), but worth adding
  if the tool is ever exposed more broadly.
- **`APP_PASSWORD` must be set as a Vercel environment variable** (alongside
  `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`) before deploying, or every
  `/api` call will 500 on missing-env-var. Documented in `README.md`.
- **Dependency advisories:** `npm audit` shows 1 moderate + 1 high finding,
  both in `vite`'s bundled dev-server `esbuild`/path handling
  (GHSA-67mh-4wv8-2f99, GHSA-fx2h-pf6j-xcff) — dev-server-only issues that do
  not affect the built static output shipped to Vercel. No fix available in
  the 5.4.x line without a breaking major-version bump; accepted as-is.

## 6. 2026-08-02 — Migrated to per-user Supabase Auth accounts

Supersedes the "single shared team password, not per-user accounts"
limitation noted in section 5. The user asked to be able to create their own
account and log back in with it, which the shared-password model couldn't
do.

**What changed:**
- Removed the custom shared-password + HMAC-signed-token system entirely:
  `APP_PASSWORD` env var, `api/auth/login.ts`, and the HMAC logic in
  `api/_lib/auth.ts` (`verifyPassword`, `createSessionToken`, `isValidToken`)
  are all deleted. The in-memory per-IP login rate limiter
  (`api/_lib/rateLimit.ts`) added earlier this session is also deleted —
  Supabase Auth has its own abuse protection at the project level, making a
  bespoke limiter on a now-nonexistent `/api/auth/login` route redundant.
- Added **Supabase Auth** (email + password): sign-up/sign-in/sign-out now
  happen client-side directly against Supabase
  (`src/lib/supabaseClient.ts`, `src/lib/auth.ts`), using the project's anon
  key (safe to expose publicly by design, unlike the service_role key).
  `src/App.tsx`'s `AuthGate` checks the session asynchronously on load and
  subscribes to `onAuthStateChange` instead of a synchronous
  `!!localStorage token` check.
- Server-side, `api/_lib/auth.ts::requireAuth` now verifies the bearer token
  by calling `supabaseAdmin().auth.getUser(token)` (delegating to Supabase's
  Auth API) instead of checking a locally-signed HMAC. Chosen over local
  JWT/JWKS verification to avoid a new dependency/secret for an app at this
  scale, and because it reflects real-time session revocation for free.
  `requireAuth`'s name/contract (`(req, res) => boolean`, now `Promise<boolean>`)
  was kept stable, so the only change needed in the three `/api/leads*`
  handlers was adding `await`.
- New env vars `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (bundled into
  the client — intentional, this is the standard public-safe Supabase
  pattern and is unrelated to the earlier concern about `VITE_`-prefixed
  vars, which was specifically about the service_role key never getting a
  `VITE_` prefix; that key's handling is unchanged). Removed the unused
  `SUPABASE_ANON_KEY` server var and `APP_PASSWORD`.
- No `leads` schema or RLS changes — the server still accesses `leads`
  exclusively via the service-role key, bypassing RLS as before. The only
  new Supabase-direct client interaction is Auth itself (`auth.users`),
  which is fully Supabase-managed.

**Deliberate scope boundary — signup is fully open.** Anyone who reaches the
login page can create an account and will see the same shared `leads` data;
this is not a multi-tenant app, so per-user accounts control *who can get
in*, not *who sees what*. User explicitly chose this over a domain-allowlist
or invite-only model, understanding the tradeoff for a business-data CRM.

**Updated / new known limitations:**
- No "forgot password" flow yet — deferred, cheap to add later since
  Supabase Auth supports it natively.
- No per-lead attribution (`created_by`) — still no audit trail of *who*
  changed a given lead, since every account has equal access to all leads.
  Out of scope for this change.
- Two Supabase dashboard settings affect signup UX and aren't controlled by
  this codebase: **Authentication → Providers → Email → "Confirm email"**
  (whether sign-up requires an emailed confirmation link before granting a
  session) and, if that's on, **Authentication → URL Configuration →
  Redirect Users** must list both the local dev origin and the deployed
  Vercel origin. Documented in `README.md`.
- Optional follow-up, not implemented: Supabase's Authentication → Attack
  Protection settings support adding a CAPTCHA (hCaptcha/Turnstile) on
  sign-up, which would be the real mitigation if scripted account creation
  ever becomes a problem under the open-signup model above.

**Verified:** exercised locally via `dev-server.ts` + `npm run dev` — sign
up, sign in, sign out, session persisting across a hard refresh,
unauthenticated `/api/leads` request → 401, authenticated request (real
token obtained via Supabase's password-grant token endpoint) → 200, tampered
token → 401. `npm run typecheck` and `npm run build` both pass.

## 7. 2026-08-02 — Full frontend redesign (multi-page SaaS UI)

Frontend-only visual/UX overhaul into a multi-page product (Dashboard, Leads,
Import, Pipeline, Profile) with a persistent sidebar, real routing, and
animation. **No backend, API, schema, or auth logic changed** — every
`/api/*` handler and `api/_lib/*` file is untouched from section 6.

**Added dependencies:** `react-router-dom` (pinned to the 6.x line, see risk
note below), `framer-motion`, `recharts`, `@fontsource/inter` (self-hosted
font, no external Google Fonts request at runtime).

**Removed:** the user-toggleable light/dark theme (`src/lib/theme.ts`,
`ThemeToggle.tsx`, all `dark:` classes) in favor of the fixed premium
palette the redesign specifies (navy sidebar, white content) — a deliberate
product decision, not an oversight; flagged to and accepted by the user.
Priority badge colors were also corrected from an inverted
hot=red/cold=blue scheme to hot=green/warm=amber/cold=red (labels unchanged:
still "Hot/Warm/Cold").

**Known accepted risk:** `npm audit` flags `react-router-dom`/`react-router`
6.0.0–7.17.0 for two moderate advisories (open redirect via backslash in
`Link`/`useNavigate`; an SSR-hydration deserialization issue). Neither
applies here — this is a pure client SPA with no SSR, and every navigation
target in the app (`Sidebar.tsx`'s nav list, `Header.tsx`'s search redirect,
`AppLayout.tsx`'s catch-all redirect) is a hardcoded literal route string,
never derived from user input. The alternative, upgrading to
`react-router-dom@7.x`, trades these for a *worse* (high-severity) RSC-mode
CSRF advisory that also doesn't apply to this app but is a bigger blast
radius if it ever did. Re-evaluate if/when a fully clean release exists.
Same treatment as the pre-existing vite/esbuild dev-only finding: documented
and accepted rather than blocking on it.

**Verified:** `npm run typecheck` and `npm run build` clean; grepped the
full built bundle to confirm the service-role key still never appears
client-side (only the anon key, which is meant to be public) and that no
`dark:`/deleted-file references remain anywhere in `src/`; confirmed no
`dangerouslySetInnerHTML`/`eval`/`innerHTML` was introduced anywhere in the
new components. Not visually verified in a real browser (no browser
automation available this session) — user asked to check it manually at
`localhost:5173`.

**Also this session:** seeded 10 realistic sample leads via real `POST
/api/leads` calls (not direct DB writes) — authenticated as a throwaway
Supabase Auth account (created, email-confirmed via the admin API, used to
call the API, then deleted afterward; the inserted lead rows are independent
of any user reference and remain). Spans all 7 pipeline stages and a natural
4 hot / 3 warm / 3 cold spread from the real scoring engine, so the
dashboard reflects actual data instead of zeros.

## 8. Folder structure

```
api/
  _lib/{auth,errors,http,scoring,supabaseAdmin,validate}.ts
  leads/{index,[id],import}.ts
src/
  components/*.tsx     (Sidebar, Header, LeadTable, PipelineBoard, LeadDrawer, StatCard, ...)
  hooks/{useCountUp,useCurrentUser}.ts
  layouts/AppLayout.tsx
  lib/{api,auth,LeadsContext,supabaseClient,toast,types}.ts(x)
  pages/{DashboardPage,LeadsPage,ImportPage,PipelinePage,ProfilePage}.tsx
  App.tsx, main.tsx, index.css, vite-env.d.ts
supabase/schema.sql        (run once in Supabase SQL Editor)
dev-server.ts               (local-only Express wrapper around the /api handlers)
AUDIT_LOG.md                 (this file)
```
