# Test Results — 1000-test stability sweep

Last run: 2026-04-23

## Summary

**1000 / 1000 passed in 368.5s** (2.7 tests/sec, 100% pass rate).

50 iterations of the 20-test suite against the live Supabase project and the local Next.js admin server.

## Per-test pass rates

| # | Test | Result |
|---|---|---|
| 01 | `GET /login` returns 200 | 50/50 ✓ |
| 02 | Login page has EWM branding | 50/50 ✓ |
| 03 | Login form has email + password fields | 50/50 ✓ |
| 04 | `GET /` redirects unauthed | 50/50 ✓ |
| 05 | `GET /sites` redirects with `?next` | 50/50 ✓ |
| 06 | `GET /overview` redirects | 50/50 ✓ |
| 07 | Deep link `/sites/[id]/live` preserves redirect | 50/50 ✓ |
| 08 | `signInWithPassword` with correct creds | 50/50 ✓ |
| 09 | Wrong password rejected | 50/50 ✓ |
| 10 | `getUser` returns authenticated user | 50/50 ✓ |
| 11 | Read sites via RLS | 50/50 ✓ |
| 12 | 19 task templates across 4 verticals | 50/50 ✓ |
| 13 | 5 demo scan codes | 50/50 ✓ |
| 14 | Read own profile | 50/50 ✓ |
| 15 | Read customers (after 0003 RLS fix) | 50/50 ✓ |
| 16 | Create shift (tests tasks INSERT policy) | 50/50 ✓ |
| 17 | Insert 3 tasks | 50/50 ✓ |
| 18 | Shift lifecycle (clock-in → start → complete) | 50/50 ✓ |
| 19 | `live_board_rows` view returns joined data | 50/50 ✓ |
| 20 | `task_events` audit trail | 50/50 ✓ |

## What was exercised

- **HTTP layer** (Next.js 16 + Turbopack): 350 total page requests across 7 routes
- **Auth layer** (Supabase GoTrue): 150 signIn/getSession/getUser calls
- **Data layer** (PostgREST + RLS): 500+ reads across all relationship-heavy queries
- **Write layer** (RLS-checked INSERTs/UPDATEs): 200+ shifts, 150+ task inserts, 50 full shift lifecycles
- **View layer** (Postgres view): 50 queries to `live_board_rows` with denormalized joins
- **Audit layer**: 50 `task_events` writes + reads

## How to re-run

```bash
# Make sure the dev server is up
cd ~/Desktop/"EWN App" && pnpm --filter admin dev

# In another shell:
cd /tmp/ewm-migrate && node test1000.mjs   # full 1000-test sweep (~6 min)
cd /tmp/ewm-migrate && node test20.mjs     # single 20-test run (~5 sec)
```

## Known flaky spots (none observed — but to watch)

- First iteration on a cold Next.js server takes ~3 min for Turbopack to compile each route. Subsequent iterations run at full speed.
- Realtime WebSocket test (not in this suite) has a known `supabase-realtime-js` + Node compatibility issue. Works in-browser.
