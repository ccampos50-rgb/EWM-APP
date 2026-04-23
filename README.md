# EWM Productivity App

Workforce productivity platform for **Elevated Workforce Management (EWM)**, a Dallas-based staffing firm serving hospitality, healthcare, mobility, and light industrial verticals.

Modeled on the MLS Productivity app (iOS) + Purple Admin (web portal), but rebuilt generic-first to handle all four EWM verticals from a single codebase.

## Docs in this folder

- [PROJECT_SPEC.md](PROJECT_SPEC.md) — Full product spec, decisions, scope
- [ARCHITECTURE.md](ARCHITECTURE.md) — Tech stack, data model, system design
- [FEATURES.md](FEATURES.md) — Feature breakdown by role and vertical
- [ROADMAP.md](ROADMAP.md) — 4–6 week MVP plan, phased delivery
- [BRANDING.md](BRANDING.md) — EWM brand guidelines for the app

## Reference material

- MLS iOS app: https://apps.apple.com/us/app/mls-productivity/id6478173099
- MLS admin (Purple Admin): https://teamsafeplus.com/mls_admin/index.php
- EWM website: https://elevated-workforce.com
- EWM tagline: *People. Performance. Elevated.*
- EWM existing SMS interview agent (Tom): 134.209.44.182:8090

Related desktop PDFs to mine for content:
- `EWM LightIndustrial Pitch.pdf`
- `EWM Mobility Services Deck.pdf`
- `EWM_Hospital_Services_Vertical.pdf`
- `EWM_Website_Mockup.pdf`

## Status

**Scaffold complete.** Monorepo is ready for Week 1 of the roadmap.

```
ewm-productivity/
├─ apps/
│   ├─ admin/           # Next.js 16 + Tailwind v4 + TS (role-based admin portal)
│   └─ mobile/          # Expo (React Native) + TS (field worker app)
├─ packages/
│   ├─ db/              # Supabase client + generated types (placeholder types)
│   ├─ domain/          # Verticals, roles, task templates (19 templates across 4 verticals)
│   └─ config/          # Brand tokens + shared Tailwind preset
├─ supabase/
│   ├─ migrations/
│   │   └─ 0001_initial_schema.sql   # 13 tables, enums, RLS policies, helper fns
│   ├─ functions/       # (empty — billing export, metric rollup go here)
│   ├─ seed.sql         # EWM tenant + demo hotel + 19 templates + 5 room QRs
│   └─ config.toml      # Supabase local dev config
├─ package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json
└─ .env.example (root + per-app)
```

### Decisions locked
- Generic multi-vertical build (no specific pilot customer yet)
- Generic placeholder branding for v1 (navy `#1E3A8A` / sky `#0EA5E9`, Inter)
- New Supabase project (not shared with Tom)
- Email auth for v1 (SMS/Twilio deferred)

### To start working

```bash
cd ~/Desktop/"EWN App"
pnpm install                             # already run once
pnpm --filter admin dev                  # Next.js on http://localhost:3000
pnpm --filter mobile start               # Expo dev server
```

### Not yet done (Week 1 tasks)
- Install Supabase CLI (`brew install supabase/tap/supabase`)
- Run `supabase start` to spin up local Postgres + apply migrations
- Wire Next.js admin to Supabase (login, middleware, RBAC)
- Wire Expo mobile to Supabase (login, site picker, home screen stub)
- Replace placeholder `types.ts` with generated types (`supabase gen types typescript --local`)
- Initialize git at the monorepo root and commit

See [ROADMAP.md](ROADMAP.md) for the week-by-week plan.
