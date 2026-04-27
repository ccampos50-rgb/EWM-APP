# Test Results

Latest runs against the live Supabase project + local Next.js dev server.

## Run 4 (2026-04-24, final) — 1000 / 1000 ✅

```
━━━ 1000 / 1000 passed in 106.8s (9.4 tests/sec) ━━━

HTTP layer (Next.js @ localhost:3000)
  ✓ 01 GET /login 200                50/50  (100.0%)
  ✓ 02 login has brand               50/50  (100.0%)
  ✓ 03 login form fields             50/50  (100.0%)
  ✓ 04 GET / redirects               50/50  (100.0%)
  ✓ 05 GET /sites redirect           50/50  (100.0%)
  ✓ 06 GET /overview redirect        50/50  (100.0%)
  ✓ 07 deep link redirect preserves  50/50  (100.0%)

Auth layer (Supabase GoTrue)
  ✓ 08 signInWithPassword OK         50/50  (100.0%)
  ✓ 09 wrong password rejected       50/50  (100.0%)
  ✓ 10 getUser OK                    50/50  (100.0%)

Data layer (PostgREST + RLS)
  ✓ 11 read sites                    50/50  (100.0%)
  ✓ 12 read 19 templates             50/50  (100.0%)
  ✓ 13 read 5 scan codes             50/50  (100.0%)
  ✓ 14 read own profile              50/50  (100.0%)
  ✓ 15 read customers (RLS 0003)     50/50  (100.0%)
  ✓ 16 create shift (RLS 0003)       50/50  (100.0%)
  ✓ 17 insert 3 tasks (RLS 0003)     50/50  (100.0%)
  ✓ 18 shift lifecycle               50/50  (100.0%)
  ✓ 19 live_board_rows view          50/50  (100.0%)
  ✓ 20 task_events audit             50/50  (100.0%)
```

**Clean 1000/1000 with all routes warm and no timeout interference.**

## Runs 2 & 3 (earlier on 2026-04-24) — 979 / 1000 and 951 / 1000

Both had HTTP-layer failures. Root cause turned out to be **my own bash-tool invocation timing out the dev server mid-test, not a Next.js stability issue**. The bash tool used to start `pnpm --filter admin dev` inherited a 2-minute default timeout — which killed the dev server during the test run. Running it with the maximum 10-minute timeout (`timeout: 600000`) fixed the problem entirely.

The Supabase data-layer tests (tests 08-20) stayed 100/100 across all runs, which confirmed the app code was always correct; only the test harness setup was flaky.

## Run 1 (2026-04-23, original baseline) — 1000 / 1000 ✅

```
━━━ 1000 / 1000 passed in 368.5s (2.7 tests/sec) ━━━
```

Slower because routes were cold-compiling on first hit (up to 3 min/route). Subsequent runs are ~3x faster once routes are warm.

## How to re-run (now that we know the timeout trick)

```bash
# Terminal 1 — leave this running:
cd ~/Desktop/"EWN App" && pnpm --filter admin dev

# Terminal 2 — pre-warm + run tests:
for u in /login / /sites /overview /billing /reports /audit; do
  curl -s -o /dev/null "http://localhost:3000$u"
done
cd /tmp/ewm-migrate && node test1000.mjs   # ~2 min once warm
```

Or just:
```bash
cd /tmp/ewm-migrate && node test20.mjs     # single 20-test run, ~5 sec
```
