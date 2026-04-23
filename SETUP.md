# Setup — What's Left for You

The monorepo is scaffolded and committed (`git log --oneline` shows `Initial monorepo scaffold`). Auth code is wired for both the admin and the mobile app. Before either app will actually work, you need to connect them to a Supabase backend.

## You have two paths. Pick one.

### Path A — Supabase Cloud (fastest; recommended)

1. Go to https://supabase.com → **New project**. Name it `ewm-productivity`. Copy the **Project URL** and **anon key** from Project Settings → API.
2. In the Supabase dashboard, open **SQL Editor** and run these two files, in order:
   - `supabase/migrations/0001_initial_schema.sql` (creates tables, RLS, enums)
   - `supabase/seed.sql` (inserts EWM tenant + demo hotel + 19 task templates)
3. Create env files:
   ```bash
   cp apps/admin/.env.example apps/admin/.env.local
   cp apps/mobile/.env.example apps/mobile/.env
   ```
   Fill in the URL and anon key in both.
4. Create your first admin user:
   - In Supabase dashboard → **Authentication** → **Users** → **Add user** → use your email + a password.
   - In **SQL Editor**, run this to create your profile + give yourself super_admin:
     ```sql
     insert into profiles (id, tenant_id, full_name, email)
     values (
       (select id from auth.users where email = 'you@example.com'),
       '00000000-0000-0000-0000-000000000001',
       'Your Name',
       'you@example.com'
     );
     insert into user_roles (profile_id, role, scope_kind)
     values (
       (select id from auth.users where email = 'you@example.com'),
       'super_admin',
       'global'
     );
     ```
5. Run the apps (see "Run" below).

### Path B — Local Supabase (fully self-contained dev env)

Requires Docker Desktop.

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/ — open it and let it finish first-run setup.
2. From the repo root:
   ```bash
   ./node_modules/.bin/supabase start
   ```
   First run downloads Postgres + auth + storage containers (a few minutes). It prints a local `API URL` (usually `http://127.0.0.1:54321`) and an `anon key`.
3. Migrations and seed under `supabase/` apply automatically on `start`.
4. Create env files:
   ```bash
   cp apps/admin/.env.example apps/admin/.env.local
   cp apps/mobile/.env.example apps/mobile/.env
   ```
   Fill in the local URL and anon key.
5. Create a user via the local Supabase Studio: http://127.0.0.1:54323 → Auth → Users. Then run the same profile/user_roles insert from Path A (step 4).

## Run

```bash
# From repo root
pnpm --filter admin dev       # http://localhost:3000 → redirects to /login
pnpm --filter mobile start    # scan QR with Expo Go, or press i for iOS sim
```

Log in with the user you created. Admin lands on the stubbed dashboard; mobile lands on the stubbed home screen.

## Regenerate types after schema changes

```bash
# Cloud project:
./node_modules/.bin/supabase gen types typescript --project-id <your-project-ref> > packages/db/src/types.ts

# Local:
./node_modules/.bin/supabase gen types typescript --local > packages/db/src/types.ts
```

## What's next (Week 2 of ROADMAP.md)

- Site picker + site QR scan on mobile
- Geo-fence validation on clock-in
- Today's task list screen
- Scan-to-start / scan-to-complete flow
- Admin: Site Manager's worker assignment UI
- Real EWM brand assets (replace placeholder navy `#1E3A8A`)
