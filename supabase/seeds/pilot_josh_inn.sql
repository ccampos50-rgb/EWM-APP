-- Pilot seed: Josh Inn, Frisco/Prosper TX
-- - Renames demo site to "Josh Inn", relocates to Frisco-Prosper midpoint,
--   widens geo-fence to 12 km so phones in either city pass clock-in.
-- - Creates 15 worker test accounts (incl. Josh Motes + Pavi Campos), all
--   scoped 'worker' to the site, password 'EwmTest2026!'.
-- - Each worker gets one 8h shift today + one tomorrow (08:00-16:00 CT) with
--   5 hospitality tasks each. Idempotent — safe to re-run.
do $do$
declare
  ewm_tenant_id constant uuid := '00000000-0000-0000-0000-000000000001';
  demo_site_id  constant uuid := '00000000-0000-0000-0000-000000000200';
  shared_password constant text := 'EwmTest2026!';

  -- Frisco (33.1507, -96.8236) and Prosper (33.2362, -96.8011) midpoint.
  -- 12 km radius easily covers both city limits + buffer.
  fence_lat constant double precision := 33.1935;
  fence_lng constant double precision := -96.8120;
  fence_m   constant integer := 12000;

  testers record;
  test_uuid uuid;
  shift_id_today uuid;
  shift_id_tomorrow uuid;
  shift_start_today timestamptz;
  shift_start_tomorrow timestamptz;
  templates text[] := array['room_clean_checkout','room_clean_stayover','room_refresh','linen_run','room_clean_checkout'];
  i int;
  room_today int;
  room_tomorrow int;
begin
  -- 1) Rename + relocate site, widen geo-fence
  update sites
  set name = 'Josh Inn',
      address = 'US-380 Corridor, Frisco / Prosper, TX',
      latitude = fence_lat,
      longitude = fence_lng,
      geofence_radius_m = fence_m,
      timezone = 'America/Chicago'
  where id = demo_site_id;

  -- 2) Expand scan codes so 15 workers don't all share the same 5 rooms.
  --    Floors 1 + 2, rooms x01..x15 = 30 scan codes total.
  insert into scan_codes (site_id, code, entity_kind, entity_ref)
  select demo_site_id, format('ROOM-%s', n), 'room', n::text
  from generate_series(101, 115) n
  on conflict (site_id, code) do nothing;

  insert into scan_codes (site_id, code, entity_kind, entity_ref)
  select demo_site_id, format('ROOM-%s', n), 'room', n::text
  from generate_series(201, 215) n
  on conflict (site_id, code) do nothing;

  -- 3) 08:00 - 16:00 America/Chicago, today and tomorrow (regardless of DST)
  shift_start_today := (date_trunc('day', (now() at time zone 'America/Chicago')) + interval '8 hours') at time zone 'America/Chicago';
  shift_start_tomorrow := shift_start_today + interval '1 day';

  -- 4) Loop over 15 testers (mix of en/es to exercise i18n)
  for testers in
    select email, full_name, lang, ord - 1 as widx
    from (values
      (1,  'josh.motes@ewm-pilot.test',     'Josh Motes',      'en'),
      (2,  'pavi.campos@ewm-pilot.test',    'Pavi Campos',     'es'),
      (3,  'maria.hernandez@ewm-pilot.test','Maria Hernandez', 'es'),
      (4,  'carlos.rivera@ewm-pilot.test',  'Carlos Rivera',   'es'),
      (5,  'sarah.johnson@ewm-pilot.test',  'Sarah Johnson',   'en'),
      (6,  'michael.brown@ewm-pilot.test',  'Michael Brown',   'en'),
      (7,  'ana.garcia@ewm-pilot.test',     'Ana Garcia',      'es'),
      (8,  'david.lee@ewm-pilot.test',      'David Lee',       'en'),
      (9,  'jose.martinez@ewm-pilot.test',  'Jose Martinez',   'es'),
      (10, 'emily.davis@ewm-pilot.test',    'Emily Davis',     'en'),
      (11, 'luis.ramirez@ewm-pilot.test',   'Luis Ramirez',    'es'),
      (12, 'jessica.wilson@ewm-pilot.test', 'Jessica Wilson',  'en'),
      (13, 'roberto.sanchez@ewm-pilot.test','Roberto Sanchez', 'es'),
      (14, 'amanda.taylor@ewm-pilot.test',  'Amanda Taylor',   'en'),
      (15, 'diego.lopez@ewm-pilot.test',    'Diego Lopez',     'es')
    ) as t(ord, email, full_name, lang)
    order by ord
  loop
    -- Auth user (find or create)
    select id into test_uuid from auth.users where email = testers.email;

    if test_uuid is null then
      test_uuid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000',
        test_uuid,
        'authenticated','authenticated',
        testers.email,
        crypt(shared_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', testers.full_name),
        now(), now(),
        '','','',''
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        test_uuid,
        jsonb_build_object('sub', test_uuid::text, 'email', testers.email, 'email_verified', true),
        'email',
        test_uuid::text,
        now(), now(), now()
      );
    else
      update auth.users
      set encrypted_password = crypt(shared_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = test_uuid;
    end if;

    insert into profiles (id, tenant_id, full_name, email, preferred_language)
    values (test_uuid, ewm_tenant_id, testers.full_name, testers.email, testers.lang)
    on conflict (id) do update
      set full_name = excluded.full_name,
          preferred_language = excluded.preferred_language;

    insert into user_roles (profile_id, role, scope_kind, scope_site_id)
    values (test_uuid, 'worker', 'site', demo_site_id)
    on conflict do nothing;

    -- Today's shift (skip if already exists)
    if not exists (
      select 1 from shifts
      where worker_id = test_uuid
        and date_trunc('day', scheduled_start at time zone 'America/Chicago')
            = date_trunc('day', shift_start_today at time zone 'America/Chicago')
    ) then
      shift_id_today := gen_random_uuid();
      insert into shifts (id, worker_id, site_id, scheduled_start, scheduled_end, status)
      values (shift_id_today, test_uuid, demo_site_id, shift_start_today, shift_start_today + interval '8 hours', 'scheduled');

      for i in 1..5 loop
        room_today := 101 + ((testers.widx * 5 + (i - 1)) % 15);
        insert into tasks (shift_id, site_id, template_code, target_ref, status)
        values (shift_id_today, demo_site_id, templates[i], room_today::text, 'assigned');
      end loop;
    end if;

    -- Tomorrow's shift
    if not exists (
      select 1 from shifts
      where worker_id = test_uuid
        and date_trunc('day', scheduled_start at time zone 'America/Chicago')
            = date_trunc('day', shift_start_tomorrow at time zone 'America/Chicago')
    ) then
      shift_id_tomorrow := gen_random_uuid();
      insert into shifts (id, worker_id, site_id, scheduled_start, scheduled_end, status)
      values (shift_id_tomorrow, test_uuid, demo_site_id, shift_start_tomorrow, shift_start_tomorrow + interval '8 hours', 'scheduled');

      for i in 1..5 loop
        room_tomorrow := 201 + ((testers.widx * 5 + (i - 1)) % 15);
        insert into tasks (shift_id, site_id, template_code, target_ref, status)
        values (shift_id_tomorrow, demo_site_id, templates[i], room_tomorrow::text, 'assigned');
      end loop;
    end if;
  end loop;

  raise notice 'Seeded 15 workers at Josh Inn (lat=% lng=% radius=%m, Frisco/Prosper TX)',
    fence_lat, fence_lng, fence_m;
end;
$do$;

-- ── Verification ────────────────────────────────────────────────────────────

-- Site: should now read "Josh Inn" with the new coords + radius
select
  s.name,
  s.address,
  s.latitude,
  s.longitude,
  s.geofence_radius_m,
  s.timezone
from sites s
where s.id = '00000000-0000-0000-0000-000000000200';

-- Workers: 15 rows, each with 2 shifts and 10 tasks
select
  p.full_name,
  p.email,
  p.preferred_language as lang,
  (select count(*) from shifts s where s.worker_id = p.id) as shifts,
  (select count(*) from tasks t join shifts s on s.id = t.shift_id where s.worker_id = p.id) as tasks
from profiles p
join user_roles ur on ur.profile_id = p.id and ur.role = 'worker'
where ur.scope_site_id = '00000000-0000-0000-0000-000000000200'
order by p.full_name;

-- Aggregate sanity: 15 workers, 30 shifts, 150 tasks
select
  (select count(distinct ur.profile_id) from user_roles ur
   where ur.role = 'worker' and ur.scope_site_id = '00000000-0000-0000-0000-000000000200') as workers,
  (select count(*) from shifts where site_id = '00000000-0000-0000-0000-000000000200') as shifts,
  (select count(*) from tasks where site_id = '00000000-0000-0000-0000-000000000200') as tasks,
  (select count(*) from scan_codes where site_id = '00000000-0000-0000-0000-000000000200') as scan_codes;
