# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| **Mobile app** | Expo (React Native) + TypeScript | iOS + Android from one codebase; native scanner, camera, geolocation via Expo modules; OTA updates; pairs well with Next.js TypeScript backend |
| **Admin web** | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | Fast to build, SSR for SEO on any public marketing surface, role-based middleware straightforward, tablet-optimized out of the box |
| **Backend** | Supabase (Postgres + Auth + Storage + Realtime) | Realtime channels power the Site Manager live board with zero extra infra; RLS policies enforce role hierarchy; shared auth with Tom (EWM SMS agent) |
| **Background jobs** | Supabase Edge Functions (Deno) + pg_cron | Billing CSV exports, metric rollups, webhook fanout |
| **Push** | Expo Push (mobile) | SMS deferred — no Twilio in v1 |
| **Hosting** | Vercel (Next.js) + Supabase Cloud | Skip DevOps; existing EWM droplet (134.209.44.182) stays for Tom |
| **Repo** | pnpm + Turborepo monorepo | Share types between mobile, web, and edge functions |

## Monorepo layout

```
ewm-productivity/
├─ apps/
│   ├─ mobile/          # Expo RN app for field workers
│   └─ admin/           # Next.js admin + site-manager dashboard
├─ packages/
│   ├─ db/              # Supabase types, migrations, seed data
│   ├─ ui/              # Shared UI components (where it makes sense)
│   ├─ domain/          # Task templates, vertical packs, business rules
│   └─ config/          # ESLint, tsconfig, tailwind preset
├─ supabase/
│   ├─ migrations/
│   ├─ functions/       # Edge functions: billing-export, metric-rollup, webhook-out
│   └─ seed.sql
└─ turbo.json
```

## Data model (core tables)

```
tenants                  -- EWM is one; future multi-tenant ready
customers                -- Hotel A, Hospital B (EWM's clients)
sites                    -- Physical locations; geo lat/lng + radius, site QR code
users                    -- All roles; linked to auth.users
user_roles               -- (user_id, role, scope_site_id | scope_customer_id | null=global)
verticals                -- hospitality | healthcare | mobility | light_industrial
task_templates           -- per-vertical: "room_clean_checkout", "patient_transport", etc.
shifts                   -- worker's scheduled/actual clock-in window at a site
tasks                    -- instance of a template assigned to a worker during a shift
task_events              -- scan events, status transitions, timestamps (append-only audit log)
scan_codes               -- maps scanned strings → entity (room 302, stall B-14, etc.)
incidents                -- supervisor-logged issues
billing_lines            -- derived: one row per billable unit (room cleaned, bed turnover, hour)
metrics_daily            -- rolled-up per worker, site, vertical, day
```

## Realtime: Site Manager live board

Supabase Realtime subscribes the tablet to:
- `shifts` WHERE `site_id = :current` — who's clocked in
- `tasks` WHERE `site_id = :current AND status != 'done'` — open work
- `task_events` WHERE `site_id = :current` — live activity feed

UI: Kanban-style columns (Assigned → In Progress → Done), plus a "Team" panel with each worker's current task + last-scan timestamp. Red-flag badge when a task exceeds its template's expected duration.

## Auth & RBAC

- Supabase Auth — email + password (or magic link) for all roles in v1. Phone OTP deferred until a real pilot needs it.
- Row-level security policies derive scope from `user_roles`:
  - Worker sees only their own shifts/tasks
  - Site Manager sees all rows where `site_id` matches their scope
  - Area Manager sees all sites under their customer/region
  - RVP/Super Admin sees all

## Offline (worker app)

SQLite (via `expo-sqlite`) mirrors the worker's current shift + today's tasks. Scans queue locally and sync when network returns. Clock-in requires network once (to validate geo-fence); after that, offline-tolerant for the shift.

## Billing export

`billing_lines` is the source of truth. Nightly Edge Function:
1. Rolls up `task_events` into `billing_lines` (one per billable unit per customer contract)
2. Writes CSV to Supabase Storage
3. POSTs a webhook to EWM's invoicing system (URL configurable per customer)

CSV columns: `customer_id, site_id, date, unit_type, unit_count, worker_hours, rate_code`.

## Integration with Tom (SMS agent) — deferred

Separate Supabase project from Tom for v1. If we later want shared identity, options:
- Cross-project sync via a nightly edge function copying Tom's candidates → this app's `users`
- Consolidate onto one Supabase project post-v1 once the data models are proven

Not in scope for MVP.
