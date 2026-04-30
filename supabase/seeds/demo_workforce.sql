-- Demo workforce seed: 100 workers, ~180 shifts (yesterday/today/tomorrow), ~1000 tasks, 8 incidents.
-- Re-runnable — uses email-based dedup. Safe to paste multiple times.
-- All workers assigned to Grand Demo Hotel (site_id 00000000-0000-0000-0000-000000000200).

create extension if not exists pgcrypto;

do $do$
declare
  -- ─────────────────────────────────────────────────────────────
  -- Configuration
  -- ─────────────────────────────────────────────────────────────
  ewm_tenant_id constant uuid := '00000000-0000-0000-0000-000000000001';
  demo_site_id  constant uuid := '00000000-0000-0000-0000-000000000200';

  worker_password constant text := 'WorkerDemo2026!';

  first_names text[] := array[
    'Maria','Carlos','Ana','Jose','Sofia','Miguel','Isabella','Juan','Luis','Camila',
    'Diego','Valentina','Pablo','Lucia','Andres','Elena','Fernando','Daniela','Roberto','Ximena',
    'Eduardo','Mariana','Alejandro','Renata','Javier','Carla','Antonio','Adriana','Manuel','Patricia',
    'Ricardo','Carmen','Hector','Lorena','Sergio','Veronica','Rafael','Gabriela','Oscar','Beatriz',
    'Felipe','Cristina','Ramon','Alicia','Salvador','Esmeralda','Guillermo','Yadira','Arturo','Rosa',
    'Emanuel','Perla','Hugo','Liliana','Joaquin','Andrea','Ignacio','Nora','Tomas','Karina',
    'Gerardo','Cynthia','Mauricio','Brenda','Vicente','Paola','Alfonso','Estela','Alberto','Susana',
    'Cesar','Magdalena','Ulises','Norma','Bryan','Gloria','Adrian','Olga','Esteban','Reyna',
    'Ivan','Marisol','Emilio','Erika','Ruben','Clara','Mateo','Rocio','James','Linda',
    'Michael','Susan','William','Sarah','David','Karen','Daniel','Lisa','John','Jennifer'
  ];

  last_names text[] := array[
    'Garcia','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Perez','Sanchez','Ramirez','Torres',
    'Flores','Rivera','Gomez','Diaz','Reyes','Morales','Cruz','Ortiz','Gutierrez','Chavez',
    'Ramos','Romero','Alvarez','Mendoza','Silva','Castro','Vargas','Rojas','Acosta','Aguilar',
    'Soto','Vega','Herrera','Medina','Salazar','Cortez','Smith','Johnson','Williams','Jones',
    'Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White'
  ];

  hospitality_templates text[] := array[
    'room_clean_checkout','room_clean_stayover','room_refresh','linen_run','banquet_setup'
  ];

  task_statuses task_status[] := array['assigned','in_progress','done','blocked','skipped']::task_status[];

  -- Loop variables
  i integer;
  worker_uuid uuid;
  worker_email text;
  worker_name text;
  worker_lang text;

  d integer;          -- day offset (-1, 0, +1)
  shift_uuid uuid;
  shift_start timestamptz;
  shift_end timestamptz;
  shift_actual_start timestamptz;
  shift_actual_end timestamptz;
  shift_status_val shift_status;

  task_count integer;
  t integer;
  task_template text;
  task_status_val task_status;
  task_started timestamptz;
  task_completed timestamptz;
  task_target text;
  room_num integer;

  total_workers integer := 100;
  total_shifts integer := 0;
  total_tasks integer := 0;

begin
  -- ─────────────────────────────────────────────────────────────
  -- 1. Workers (auth.users + profiles + worker role)
  -- ─────────────────────────────────────────────────────────────
  for i in 1..total_workers loop
    worker_email := 'worker' || lpad(i::text, 3, '0') || '@ewm-internal.test';
    worker_name := first_names[1 + ((i - 1) % array_length(first_names, 1))]
                || ' '
                || last_names[1 + (((i - 1) / array_length(first_names, 1)) % array_length(last_names, 1))];
    worker_lang := case when i % 3 = 0 then 'en' else 'es' end;

    -- Skip if already created
    select id into worker_uuid from auth.users where email = worker_email;

    if worker_uuid is null then
      worker_uuid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000',
        worker_uuid,
        'authenticated','authenticated',
        worker_email,
        crypt(worker_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', worker_name),
        now(), now(),
        '','','',''
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        worker_uuid,
        jsonb_build_object('sub', worker_uuid::text, 'email', worker_email, 'email_verified', true),
        'email',
        worker_uuid::text,
        now(), now(), now()
      );
    end if;

    insert into profiles (id, tenant_id, full_name, email, preferred_language)
    values (worker_uuid, ewm_tenant_id, worker_name, worker_email, worker_lang)
    on conflict (id) do update set full_name = excluded.full_name, preferred_language = excluded.preferred_language;

    insert into user_roles (profile_id, role, scope_kind, scope_site_id)
    values (worker_uuid, 'worker', 'site', demo_site_id)
    on conflict do nothing;

    -- ─────────────────────────────────────────────────────────────
    -- 2. Shifts: yesterday (clocked_out, all tasks done), today (mix), tomorrow (scheduled)
    -- ─────────────────────────────────────────────────────────────
    for d in -1..1 loop
      -- Probability of working each day: 70% today, 50% yesterday, 60% tomorrow
      if (d = 0 and random() < 0.70)
         or (d = -1 and random() < 0.50)
         or (d = 1 and random() < 0.60) then

        -- Skip if shift already exists for this worker on this day
        if exists (
          select 1 from shifts
          where worker_id = worker_uuid
            and date_trunc('day', scheduled_start) = date_trunc('day', now() + (d * interval '1 day'))
        ) then
          continue;
        end if;

        -- Two shift patterns: morning 8-4 or afternoon 2-10
        if random() < 0.7 then
          shift_start := date_trunc('day', now() + (d * interval '1 day')) + interval '8 hours';
          shift_end := shift_start + interval '8 hours';
        else
          shift_start := date_trunc('day', now() + (d * interval '1 day')) + interval '14 hours';
          shift_end := shift_start + interval '8 hours';
        end if;

        if d = -1 then
          shift_status_val := 'clocked_out'::shift_status;
          shift_actual_start := shift_start + (interval '5 minutes' * (random() * 4)::int);
          shift_actual_end := shift_end - (interval '5 minutes' * (random() * 6)::int);
        elsif d = 0 then
          -- Today: mix of clocked_in, clocked_out, scheduled
          if shift_start < now() and shift_end > now() then
            shift_status_val := 'clocked_in'::shift_status;
            shift_actual_start := shift_start + (interval '5 minutes' * (random() * 4)::int);
            shift_actual_end := null;
          elsif shift_end < now() then
            shift_status_val := 'clocked_out'::shift_status;
            shift_actual_start := shift_start + (interval '5 minutes' * (random() * 4)::int);
            shift_actual_end := shift_end - (interval '5 minutes' * (random() * 6)::int);
          else
            shift_status_val := 'scheduled'::shift_status;
            shift_actual_start := null;
            shift_actual_end := null;
          end if;
        else
          shift_status_val := 'scheduled'::shift_status;
          shift_actual_start := null;
          shift_actual_end := null;
        end if;

        shift_uuid := gen_random_uuid();

        insert into shifts (
          id, worker_id, site_id, scheduled_start, scheduled_end,
          actual_start, actual_end, status, clock_in_lat, clock_in_lng, created_at
        ) values (
          shift_uuid, worker_uuid, demo_site_id, shift_start, shift_end,
          shift_actual_start, shift_actual_end, shift_status_val,
          case when shift_actual_start is not null then 32.7767 else null end,
          case when shift_actual_start is not null then -96.7970 else null end,
          shift_start - interval '1 day'
        );

        total_shifts := total_shifts + 1;

        -- ─────────────────────────────────────────────────────────────
        -- 3. Tasks per shift: 4-9 tasks
        -- ─────────────────────────────────────────────────────────────
        task_count := 4 + (random() * 5)::int;

        for t in 1..task_count loop
          task_template := hospitality_templates[1 + (random() * (array_length(hospitality_templates, 1) - 1))::int];
          room_num := 100 + (random() * 200)::int;
          task_target := case
            when task_template = 'banquet_setup' then 'Salon ' || chr(65 + (random() * 5)::int)
            when task_template = 'linen_run' then 'Cart ' || (1 + (random() * 9)::int)::text
            else room_num::text
          end;

          if d = -1 then
            -- Yesterday: 90% done, 8% blocked, 2% skipped
            task_status_val := case
              when random() < 0.90 then 'done'
              when random() < 0.98 then 'blocked'
              else 'skipped'
            end::task_status;
          elsif d = 0 then
            -- Today: depends on shift status
            if shift_status_val = 'clocked_out' then
              task_status_val := case when random() < 0.85 then 'done' when random() < 0.95 then 'blocked' else 'skipped' end::task_status;
            elsif shift_status_val = 'clocked_in' then
              task_status_val := case
                when random() < 0.40 then 'done'
                when random() < 0.55 then 'in_progress'
                when random() < 0.95 then 'assigned'
                else 'blocked'
              end::task_status;
            else
              task_status_val := 'assigned'::task_status;
            end if;
          else
            -- Tomorrow: all assigned
            task_status_val := 'assigned'::task_status;
          end if;

          task_started := null;
          task_completed := null;

          if task_status_val = 'done' then
            task_started := shift_actual_start + (interval '5 minutes' * t * 4);
            task_completed := task_started + (interval '15 minutes' + interval '20 minutes' * random());
          elsif task_status_val = 'in_progress' then
            task_started := now() - (interval '1 minute' * (random() * 25)::int);
          end if;

          insert into tasks (
            shift_id, site_id, template_code, target_ref, status,
            started_at, completed_at, notes, created_at
          ) values (
            shift_uuid, demo_site_id, task_template, task_target, task_status_val,
            task_started, task_completed,
            case when task_status_val = 'blocked' then 'Supply shortage' else null end,
            shift_start - interval '1 hour'
          );

          total_tasks := total_tasks + 1;
        end loop;

      end if;
    end loop;
  end loop;

  -- ─────────────────────────────────────────────────────────────
  -- 4. Incidents (8 random ones across recent shifts)
  -- ─────────────────────────────────────────────────────────────
  insert into incidents (site_id, reporter_id, category, severity, description, created_at)
  select
    demo_site_id,
    p.id,
    (array['safety','equipment','supply','client_complaint','property_damage','other'])[1 + (random() * 5)::int],
    (array['low','low','medium','medium','high'])[1 + (random() * 4)::int],
    case when random() < 0.5 then 'Reported during shift handoff.' else 'Flagged by site manager during walkthrough.' end,
    now() - (interval '1 hour' * (random() * 36)::int)
  from profiles p
  join user_roles ur on ur.profile_id = p.id and ur.role = 'worker'
  where p.tenant_id = ewm_tenant_id
  order by random()
  limit 8
  on conflict do nothing;

  raise notice 'Seeded: % workers · % new shifts · % new tasks', total_workers, total_shifts, total_tasks;
end;
$do$;

-- Quick verification view
select
  (select count(*) from profiles p join user_roles ur on ur.profile_id = p.id and ur.role = 'worker' where p.tenant_id = '00000000-0000-0000-0000-000000000001') as workers,
  (select count(*) from shifts where site_id = '00000000-0000-0000-0000-000000000200') as shifts,
  (select count(*) from tasks where site_id = '00000000-0000-0000-0000-000000000200') as tasks,
  (select count(*) from incidents where site_id = '00000000-0000-0000-0000-000000000200') as incidents;
