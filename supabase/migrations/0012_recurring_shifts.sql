-- 0012 — Recurring shift templates + bulk shift generation
--
-- A recurring_shift describes "Worker X works at Site Y on these days at these
-- times with these task templates." The admin "Generate next N days" button
-- materializes them into the shifts/tasks tables.

create table if not exists recurring_shifts (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid not null references sites(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  days_of_week int[] not null,                -- 0=Sun .. 6=Sat
  start_time time not null,
  end_time time not null,
  task_template_codes text[] not null default '{}',
  active boolean not null default true,
  starts_on date not null default current_date,
  ends_on date,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  check (array_length(days_of_week, 1) > 0),
  check (days_of_week <@ array[0,1,2,3,4,5,6]),
  check (end_time > start_time),
  check (ends_on is null or ends_on >= starts_on)
);

create index if not exists recurring_shifts_site_idx on recurring_shifts(site_id);
create index if not exists recurring_shifts_worker_idx on recurring_shifts(worker_id);

alter table recurring_shifts enable row level security;

create policy "recurring_shifts_select" on recurring_shifts for select
  using (has_site_access(site_id));

create policy "recurring_shifts_write" on recurring_shifts for all
  using (
    has_site_access(site_id) and (
      has_role('super_admin') or has_role('rvp')
      or has_role('area_manager') or has_role('site_manager')
    )
  )
  with check (
    has_site_access(site_id) and (
      has_role('super_admin') or has_role('rvp')
      or has_role('area_manager') or has_role('site_manager')
    )
  );
