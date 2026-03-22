# Trading Journal Project Plan

## 1. Product Goal

Build a fast, clean trading journal web app that runs well on Vercel's free Hobby plan for personal use.

Target audience for v1:

- you
- a few invited friends
- occasional guests evaluating the app in demo mode
- private hobby use, not a commercial SaaS

The app should cover the features traders expect from professional journaling tools:

- manual trade entry
- CSV import from brokers
- multi-account tracking
- P&L tracking
- win rate / expectancy / drawdown stats
- equity curve and daily performance graphs
- setup and tag analysis
- notes, screenshots, and post-trade review
- filtering by symbol, setup, tag, date range, and account

## Current Status

Already implemented in the repo:

- Next.js app scaffolded with `src/app`
- Supabase SSR helper setup
- root `proxy.ts` for auth session refresh
- synthetic guest/demo dataset and guest pages
- login page with email/password sign-in
- protected real-user dashboard
- first SQL migration for `public.trades`
- manual real trade create / edit / delete
- personal dashboard with timeframe-aware summary stats
- cumulative P&L chart
- compact timeframe picker
- guest and personal navigation split

Current split between fake and real data:

- `/demo` routes use synthetic local data only
- `/dashboard` is for authenticated real users
- `public.trades` is the first real database table

Immediate next build target:

- turn setups, mistakes, and review data into first-class features
- move dashboard calculations toward SQL-backed reporting
- build a real journal table and analytics views optimized for filtering

## 2. Constraints We Should Design Around

### Hosting

We should optimize for Vercel Hobby first:

- one Next.js app
- no separate always-on backend
- no queue worker service on day one
- no architecture that depends on long-running jobs

Important constraint:

- Vercel Hobby is aligned with this project because the app is intended for private, non-commercial use
- Hobby usage is generous for an MVP, but we should still design to stay well below function and analytics limits
- cron jobs exist on Hobby, but they are limited enough that we should not depend on frequent scheduled processing

### Free-tier discipline

The stack should avoid:

- unnecessary serverless invocations
- heavy image processing in our own functions
- large function bundles
- chatty database patterns

Current Supabase Free-plan assumptions we should design around:

- 2 free projects
- 500 MB database per project
- 1 GB storage
- 50,000 monthly active users

Those limits are enough for a personal journal MVP if we keep screenshots compressed and avoid storing unnecessary derived data.

### Demo / guest requirement

The app should support a guest experience that shows the core product without exposing any real private trading data.

Important product rule:

- guests should see demo data, not masked versions of your real trades
- demo mode should feel fully usable and representative
- guest access should be read-only in v1

## 3. Recommended Stack

## Frontend + App Framework

- Next.js with App Router
- TypeScript
- React Server Components by default
- Client Components only for charts, tables, forms, and local interactions

Why:

- best fit for Vercel deployment
- one codebase for UI, auth-aware routing, forms, and APIs
- easy SSR for dashboards and protected pages

## Styling + UI

- Tailwind CSS
- `shadcn/ui` for accessible primitives and internal design system scaffolding
- Radix UI where needed through `shadcn/ui`
- `lucide-react` for icons

Why:

- fast to build with
- easy to keep the UI consistent
- good control over dense data-entry screens and analytics layouts

## Data Visualization

- Recharts for dashboards and performance charts
- TanStack Table for the trade journal grid

Why:

- enough for equity curve, P&L bars, day-of-week heatmaps, distribution charts, and setup breakdowns
- much lighter and faster to ship than jumping straight into a custom D3 layer
- can be replaced later if we need more advanced charting

## Forms + Validation

- React Hook Form
- Zod

Why:

- strong validation for trade entry and import flows
- shared schemas between client and server

## Backend Pattern

- Next.js Server Actions for most create/update/delete flows
- Next.js Route Handlers for CSV import, file uploads, export endpoints, and webhooks if needed later
- Node.js runtime for all data-heavy server work

Why:

- keeps the architecture simple
- avoids building a separate backend too early
- fits Vercel serverless well

## Database + Auth + File Storage

- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Row Level Security on all user-owned data

Why:

- one vendor gives us auth, relational data, and screenshot storage
- Postgres is the right database for analytical queries
- RLS is a strong fit for per-user private journal data
- free tier is enough for a personal MVP

Important implementation choice:

- use Supabase SQL migrations plus generated TypeScript database types
- do not add a separate ORM in v1

Reason:

- journaling analytics are naturally SQL-heavy
- avoiding an ORM keeps the stack smaller and makes RLS, views, and SQL functions easier to manage
- we can add Kysely or Drizzle later if the query layer becomes painful

## Tooling

- ESLint
- Prettier
- Vitest for unit tests
- React Testing Library for component behavior
- Playwright for a few end-to-end flows

## Analytics / Monitoring

- Vercel Web Analytics
- Vercel Speed Insights
- optional Sentry later

## 4. Architecture Decision

Start with a single-app modular monolith, not a monorepo.

That means:

- one Next.js app
- one Supabase project
- one deployment target
- domain-based folders inside the app

Why this is the right first move:

- fastest path to MVP
- lowest operational complexity
- easiest to host on Vercel Hobby
- enough flexibility to support future extraction if the app grows

We should only move to a monorepo when we actually need one, for example:

- mobile app
- a separate ingestion worker
- broker integration service
- shared component package across multiple apps

## 5. Domain Model We Should Design For

Professional journaling tools become hard to extend if the trade model is too simple. We should model both trades and executions from the start.

### Core entities

- `profiles`
- `trading_accounts`
- `instruments`
- `trades`
- `trade_executions`
- `trade_tags`
- `setups`
- `mistakes`
- `trade_notes`
- `trade_media`
- `daily_journal_entries`
- `import_jobs`
- `import_rows`

### Why both `trades` and `trade_executions`

This lets us support:

- scale in / scale out
- partial exits
- average entry and average exit
- more accurate P&L
- MFE and MAE later
- cleaner broker import support

### Suggested ownership rule

Every user-owned row includes:

- `user_id`
- `created_at`
- `updated_at`

And most filtering screens should assume `user_id` scoping first.

## 6. Key Product Areas

### A. Dashboard

Show the fastest high-signal overview:

- total P&L
- realized P&L
- win rate
- profit factor
- expectancy
- average win / average loss
- current drawdown
- streaks
- recent trades
- equity curve
- P&L by day chart

### B. Trade Journal

Core table experience:

- sortable and filterable trade table
- quick add trade
- edit trade drawer/modal
- bulk tag assignment
- symbol / setup / account filters
- saved views later

### C. Trade Detail View

Each trade should support:

- thesis
- execution notes
- mistakes made
- lessons learned
- screenshots before / during / after
- tags
- setup classification
- emotion / discipline scoring later

### D. Analytics

Professional-feeling analytics should include:

- equity curve
- daily / weekly / monthly P&L
- performance by setup
- performance by symbol
- long vs short stats
- best time of day
- best day of week
- win rate by tag
- average hold time
- largest winners / losers
- realized return %
- total traded capital
- currently invested capital
- P&L % by setup, symbol, and tag
- MAE / MFE later
- R-multiple and expectancy in R later

### E. Import

Start with CSV import before direct broker integrations.

Why:

- fastest to ship
- lowest maintenance
- covers most real workflows early

### F. Review / Playbook

Include a space for:

- setup definitions
- ideal checklist
- common mistakes
- examples of A+ trades

This is a major difference between a basic trade log and a real journaling platform.

### H. Mistake Detection

This needs to be a core module, not an afterthought.

Most useful features:

- mistake tags on each trade
- context tags on each trade
- planned vs actual entry / stop / target
- followed-plan boolean
- confidence / grade / discipline score
- best setup and worst mistake reports
- filtering by setup + mistake + symbol + session + date range

### I. Strategy Design

The app should help answer:

- which setups are actually profitable
- under what conditions those setups work best
- which repeated mistakes erase edge
- what rules should be added to the playbook

Most useful strategy tools:

- setup-level performance cards
- setup playbook pages with checklist and examples
- tag-level and mistake-level performance tables
- what-if filtering across timeframe, session, symbol, and setup
- review screens that compare A+ trades against failed trades

### G. Guest Demo Mode

Guests should be able to explore:

- dashboard
- journal table
- trade detail pages
- analytics views
- playbook examples

Guest restrictions:

- no access to real user rows
- no write access to production journal data
- no export
- no media uploads
- no account settings access

Recommended approach:

- seed a dedicated demo dataset
- expose it through a separate guest/demo route group
- keep the guest dataset isolated from normal user data paths

## 7. Database Structure

We should separate database concerns like this:

- `public` schema for app tables exposed through Supabase APIs with strict RLS
- `private` schema for internal helper tables/functions if needed later
- SQL views for reporting and dashboard reads

### Initial tables

Recommended first-pass tables:

1. `profiles`
2. `trading_accounts`
3. `setups`
4. `trades`
5. `trade_executions`
6. `tags`
7. `trade_tag_links`
8. `trade_notes`
9. `trade_media`
10. `daily_journal_entries`
11. `import_jobs`
12. `import_rows`
13. `mistakes`
14. `trade_mistake_links`
15. `playbook_rules`
16. `trade_review_scores`

### Suggested next schema changes

Add first-class journaling fields to `trades`:

- `account_id`
- `setup_id`
- `status`
- `entry_value`
- `exit_value`
- `realized_pnl`
- `realized_pnl_percent`
- `holding_minutes`
- `trade_date`
- `session_bucket`
- `day_of_week`
- `followed_plan`
- `confidence_rating`
- `grade`

Important note:

- the current `trades` table is enough to move fast now
- once we add more analytics, we should promote derived fields like `entry_value`, `realized_pnl`, and `holding_minutes` into generated or write-time maintained columns so dashboard pages are not recomputing everything in JavaScript
- if Supabase generated columns are too restrictive for some fields, use SQL triggers to keep those denormalized fields updated on insert and update

### Demo data strategy

Do not build guest mode by hiding or scrambling real values from your actual trades.

Instead:

- create a seeded demo user or dedicated demo dataset
- populate it with realistic but synthetic trades, notes, tags, setups, and screenshots
- let guest pages read only from that demo dataset
- keep all real users on the standard authenticated path

This avoids privacy mistakes and keeps the demo stable for screenshots and onboarding.

### Initial reporting views

Recommended SQL views:

- `v_trade_metrics`
- `v_daily_pnl`
- `v_setup_performance`
- `v_symbol_performance`
- `v_account_performance`
- `v_mistake_performance`
- `v_tag_performance`
- `v_time_of_day_performance`
- `v_day_of_week_performance`
- `v_rule_adherence_performance`

Reason:

- dashboards can read from stable reporting views
- business logic stays closer to the data
- makes the frontend simpler

### Index strategy

To keep filtering fast as the journal grows, add indexes around the way traders actually query:

- `(user_id, trade_date desc)`
- `(user_id, opened_at desc)`
- `(user_id, status, trade_date desc)`
- `(user_id, setup_id, trade_date desc)`
- `(user_id, symbol, trade_date desc)`
- `(user_id, account_id, trade_date desc)`
- junction-table indexes for tags and mistakes by `(user_id, trade_id)` and `(user_id, tag_id)` / `(user_id, mistake_id)`

These matter more than adding more frontend optimization tricks.

## 8. Project Structure

Use a single Next.js app with `src/` layout.

```text
/
  plan.md
  AGENTS.md
  package.json
  tsconfig.json
  next.config.ts
  .env.example
  proxy.ts
  public/
  supabase/
    migrations/
      20260321180000_create_trades.sql
  src/
    app/
      dashboard/
        page.tsx
      demo/
        layout.tsx
        page.tsx
        journal/
          page.tsx
        trades/
          [tradeId]/
            page.tsx
      login/
        actions.ts
        page.tsx
      page.tsx
    lib/
      demo-data.ts
      supabase/
        client.ts
        config.ts
        proxy.ts
        server.ts
```

### Current implemented routes

- `/`
- `/login`
- `/dashboard`
- `/demo`
- `/demo/journal`
- `/demo/trades/[tradeId]`

### Planned near-term additions

- `/trades/new`
- `/trades/[tradeId]/edit`
- `/journal`
- `/analytics`
- `/playbook`
- shared reusable components under `src/components`

## 9. Folder Responsibility Rules

To keep the codebase clean:

### `src/app`

- routes
- layouts
- page composition
- route-level loading/error states

### `supabase/`

- source of truth for schema migrations
- first migration for `public.trades` already lives here
- later: seed data and generated DB types

### Current auth / data boundary

- guest routes must read from synthetic local data only
- authenticated routes must read from Supabase only
- do not mix demo records into real-user queries

## 10. UI/UX Principles

The journal should feel like a professional tool, not a template dashboard.

Guidelines:

- dense but readable layouts
- fast keyboard-friendly data entry
- charts that summarize without clutter
- clear use of green/red but not color alone for meaning
- mobile support for review, not necessarily full power-user editing on day one

Important UX rule:

- entering a trade should take as few clicks as possible

That means:

- defaults for account and setup
- inline date/time inputs
- quick-add tags
- save-and-add-another flow

For guest UX:

- guests should be able to land directly on a polished dashboard
- clearly label the experience as demo data
- keep the experience interactive for filtering and exploration
- disable write actions with clear messaging instead of broken buttons

## 11. Security Rules

Non-negotiables:

- enable RLS on every user-owned table
- never expose Supabase service-role keys to the client
- keep privileged write logic on the server
- validate all input with Zod before inserts/updates

For this private multi-user setup:

- support normal sign-in for invited users only
- keep self-serve public signup disabled in v1
- add a simple allowlist or invite flow before opening access wider
- allow unauthenticated guest/demo browsing only on demo routes

Guest-mode enforcement rules:

- demo routes only query synthetic demo data
- authenticated routes only query the signed-in user's data
- never branch on "guest means hide P&L values from real rows"
- keep write handlers blocked for guest access

## 12. Performance Rules

For Vercel Hobby, we should be conservative:

- prefer server-rendered pages with cached chrome/layout where possible
- fetch dashboard data in a few composed queries, not many tiny requests
- use reporting views for charts
- optimize uploaded screenshots before storage on the client when possible
- keep large CSV parsing in a dedicated route handler
- move expensive trade math out of React render paths and into SQL-backed reads as data grows
- use server-side pagination and filtering for the journal grid
- avoid re-reading the same dashboard data multiple times in one request
- cache guest/demo data aggressively because it is synthetic and static
- after mutations, invalidate only the affected dashboard and journal reads instead of forcing full reload patterns

Recommended app-level caching pattern:

- use React `cache()` for per-request deduping of repeated Supabase reads
- use Next cache tags for analytics reads that can be invalidated after create/update/delete
- call `revalidateTag` after trade mutations
- keep user-specific authenticated pages dynamic, but cache the derived analytics payloads they consume when safe

Recommended database performance pattern:

- use SQL views for summary and chart reads
- use write-time maintained derived columns for per-trade metrics
- add targeted indexes before adding more client-side memoization
- prefer one grouped aggregate query over many row-by-row calculations
- keep guest/demo entirely in local static data so it has near-zero query cost

Do not build v1 around:

- websockets
- real-time collaboration
- background job infrastructure
- complex event pipelines

## 13. Initial Feature Scope

## MVP

- auth
- guest/demo mode with seeded synthetic data
- onboarding
- account creation
- manual trade entry
- edit/delete trade
- tags and setups
- journal table with filters
- trade detail page with notes
- screenshot upload
- dashboard stats
- core charts
- CSV import for at least one broker format
- mistake tagging
- playbook-linked setups
- timeframe-aware analytics
- performant SQL-backed summary reads

### Items already done

- guest/demo mode with seeded synthetic data
- login page and protected dashboard shell
- initial `trades` migration
- manual trade create / edit / delete
- timeframe-aware dashboard summary and cumulative chart

## V1.1

- multiple broker CSV adapters
- saved filters
- playbook module
- weekly review screen
- export to CSV
- setup analytics
- mistake analytics
- screenshot upload and review workflow

## V1.2

- advanced metrics such as MAE/MFE
- mistake tracking analytics
- calendar view
- trade replay or annotation support
- notification/reminder flows
- materialized aggregates only if plain views become too slow

## 14. Suggested Build Order

1. Completed: bootstrap Next.js, Supabase helpers, route protection, and demo route group.
2. Completed: create the first `trades` schema and RLS policies.
3. Completed: build manual trade entry, edit, delete, and range-aware dashboard metrics.
4. Next: add `setups`, `mistakes`, `trade_tag_links`, and trade-review schema.
5. Next: add journal page with server-side filters and pagination.
6. Next: move current dashboard summary math into SQL views or RPC-backed aggregate queries.
7. Next: build setup performance, mistake performance, and tag performance analytics.
8. Then: add screenshot uploads for authenticated users only.
9. Then: add CSV import pipeline.
10. Then: add playbook pages and review tools.
11. Then: add tests around real-user isolation, guest/demo access, and analytics correctness.

## 15. Environment Variables

Expected `.env` keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (optional newer key format)
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Potential later additions:

- `SENTRY_DSN`
- `RESEND_API_KEY`

## 16. Recommendation Summary

If we want the best balance of speed, maintainability, and Vercel-free compatibility, we should start with:

- Next.js + TypeScript
- Tailwind + `shadcn/ui`
- Recharts + TanStack Table
- React Hook Form + Zod
- Supabase for Postgres + Auth + Storage
- SQL views + RLS instead of adding an ORM immediately
- single-app modular monolith structure
- guest/demo mode powered by seeded synthetic data, not masked real data

This is the simplest architecture that can still grow into a serious trading journal product.
It also fits a private multi-user hobby deployment for a small trusted group.

## 17. What We Should Do Next

After this plan, the next practical step is:

1. expand the schema for setups, mistakes, tags, and review fields
2. add server-side journal filters and a dedicated journal page
3. move dashboard metrics into SQL-backed reporting reads
4. build setup and mistake analytics before adding more cosmetic dashboard tiles
