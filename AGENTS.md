<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project-Specific Rules

- App code lives in `src/app`, not `app/`.
- Auth session refresh is handled by root `proxy.ts` and `src/lib/supabase/proxy.ts`.
- Supabase helpers live in `src/lib/supabase/`. Reuse them instead of creating new client setup code.
- Guest/demo routes must only read from `src/lib/demo-data.ts`.
- Authenticated real-user routes must read from Supabase-backed data only.
- Do not mask or transform real trades into guest/demo output. Guest mode is synthetic only.
- The first real table is defined in `supabase/migrations/20260321180000_create_trades.sql`.
- Current real auth flow is private-only: users are created manually in Supabase, and there is no public signup flow yet.
- When editing auth pages, preserve the distinction between `/login` for real users and `/demo` for guest access.
- As analytics grow, prefer SQL views, RPCs, or write-time maintained derived columns over recomputing large metric sets in React page components.
- Keep guest/demo analytics static and local; do not introduce database reads for demo mode.
- For journal and analytics queries, optimize around `user_id` + timeframe filters first and preserve index-friendly query shapes.
- After trade mutations, prefer targeted revalidation of affected reads over broad cache busting.
- Before changing route conventions or auth patterns, re-check the current Next.js docs in `node_modules/next/dist/docs/`.
