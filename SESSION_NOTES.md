# Session Notes — where to pick up

Last worked: 2026-04-23

## What's live right now

**Supabase project**: `pbhtuyjigpldvcztepss`
- URL: https://pbhtuyjigpldvcztepss.supabase.co
- Region: East US (Ohio)
- Plan: Pro

**Migrations applied (all 5)**:
- `0001_initial_schema.sql` — 13 tables, enums, RLS, helper fns
- `0002_storage_and_realtime.sql` — task-photos bucket, Realtime publication
- `0003_fix_rls_policies.sql` — missing policies discovered during testing
- `0004_billing_exports.sql` — billing-exports bucket, customer_rates, amount_cents
- `0005_push_tokens.sql` — **NOT YET APPLIED** — paste into SQL Editor before next session

**Auth**:
- super_admin user: `ccampos50@gmail.com` / `EwmAdmin2026!`
- Scope: global

**Env files**:
- `apps/admin/.env.local` — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sb_publishable_...)
- `apps/mobile/.env` — same two with `EXPO_PUBLIC_*` prefix

## Dev servers

Run from `~/Desktop/EWN\ App/`:
```bash
pnpm --filter admin dev       # http://localhost:3000
pnpm --filter mobile start    # Expo dev (press i for iOS sim)
```

Login at http://localhost:3000/login with `ccampos50@gmail.com` / `EwmAdmin2026!`.

## What's built

**Admin** (`apps/admin/`):
- `/login` — email/password auth via Supabase
- `/` — dashboard with stat placeholders
- `/overview` — Area Manager multi-site rollup with completion % bars
- `/sites` — sites list table
- `/sites/[id]` — site detail with today's shifts + tasks, Reassign links
- `/sites/[id]/live` — Site Manager live board with Supabase Realtime
- `/sites/[id]/new-shift` — schedule shift + pick vertical-filtered templates
- `/sites/[id]/tasks/[id]/reassign` — move task to another shift
- `/billing` — per-customer MTD totals + rate schedule
- `/audit` — task_events log viewer with filters

**Mobile** (`apps/mobile/`):
- Auth + navigation (React Navigation native stack)
- Sites → SiteDetail → TaskList → TaskDetail → ClockOut flow
- Photo proof via expo-image-picker for `requires_photo` tasks
- Incident reporting with categories + severity + photo
- Geo-fence validation on clock-in
- Scan-to-start / scan-to-complete via expo-camera
- i18n scaffolding (en/es) with expo-localization for device locale detect
- Push notification registration with token persistence on profiles.push_token

**Backend**:
- Schema + RLS + Realtime publication
- Edge Function `supabase/functions/billing-rollup/index.ts` — **NOT DEPLOYED YET**
- Nightly CSV export target: `billing-exports` Storage bucket

## Testing

- **20-test HTTP + Supabase suite**: `/tmp/ewm-migrate/test20.mjs` — **20/20 passing**
- **1000-test stability sweep**: `/tmp/ewm-migrate/test1000.mjs` — **1000/1000 passing** in 368.5s (100% pass rate, see [TEST_RESULTS.md](TEST_RESULTS.md))
- Mobile typecheck: **clean** (i18n + push notifications wired)
- Admin typecheck: **clean**
- Both run with `node test20.mjs` / `node test1000.mjs` after Next.js is up

## Known issues

- **macOS APFS / Spotlight corruption** — files on Desktop intermittently get truncated post-write. Affects `.git/HEAD`, various code files. Symptom: `wc -c` shows bytes, `cat` returns empty. Fix: rewrite the file. Suspect iCloud Drive sync for Desktop or Time Machine snapshots. Consider moving repo out of ~/Desktop.
- **Supabase DB password unknown** — user reset auth user password via UI, DB password state unclear. Use SQL Editor copy-paste for migrations.
- **Realtime smoke test fails in Node** — known supabase-realtime-js issue with Node WebSocket/phoenix stack. Works in browser.

## Pending — waiting on user

1. **GitHub remote** — create empty repo at github.com/new, paste URL here, I'll add remote + push
2. **Supabase access token** — generate at supabase.com/dashboard/account/tokens, paste here, I'll deploy the billing-rollup Edge Function
3. **Apply migration 0005** — paste `supabase/migrations/0005_push_tokens.sql` into Supabase SQL Editor

## Roadmap — what's next

**Post-MVP polish** (per ROADMAP.md):
- Real EWM brand assets (swap placeholder navy/sky for actual palette)
- Spanish i18n expansion across all screens (scaffolding done, screens need `useTranslation()` wiring)
- Pilot customer selection + real site setup
- TestFlight + Google Play internal track
- Schedule billing-rollup via pg_cron: `select cron.schedule('billing-rollup', '0 2 * * *', $$ select net.http_post(...) $$);`

**Possible next session priorities**:
- Option A: push + deploy (the two pending user actions above)
- Option B: wire Spanish translations through all screens
- Option C: real brand assets + app icon
- Option D: pilot onboarding flow (onboarding script, site QR generator, first-run walkthrough)

## Git log

Commits from this session:
```
60635d3 Week 4: billing rollup + audit log + billing admin page
369fd55 Fix missing RLS policies surfaced by end-to-end testing
4e859b5 Add Week 3 screens to preview gallery (live board, overview, reassign, incident report, photo proof)
a215f1c Week 3: live board, task reassign, overview, incidents, photo proof
d050948 Add static HTML preview gallery for Weeks 1-2 screens
f683917 Week 2: worker flow + admin site mgmt + shift creation
2035ab8 Add SETUP.md with Supabase onboarding paths + ignore tsbuildinfo
f7517a7 Initial monorepo scaffold
```

Plus a final Week 5 commit with mobile i18n, push notifications, and this file.
