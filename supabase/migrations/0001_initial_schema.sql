-- EWM Productivity: initial schema
-- Roles: super_admin, rvp, area_manager, site_manager, worker
-- Hierarchy: tenant > customer > site > shift > task

create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type role as enum (
  'super_admin',
  'rvp',
  'area_manager',
  'site_manager',
  'worker'
);

create type vertical as enum (
  'hospitality',
  'healthcare',
  'mobility',
  'light_industrial'
);

create type task_status as enum (
  'assigned',
  'in_progress',
  'done',
  'blocked',
  'skipped'
);

create type shift_status as enum (
  'scheduled',
  'clocked_in',
  'clocked_out',
  'no_show'
);

create type scope_kind as enum (
  'global',
  'customer',
  'site'
);

-- ─────────────────────────────────────────────────────────────
-- Tenants (EWM is one; multi-tenant ready)
-- ─────────────────────────────────────────────────────────────
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Customers (EWM's clients — hotels, hospitals, rental lots, warehouses)
-- ─────────────────────────────────────────────────────────────
create table customers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  vertical vertical not null,
  billing_webhook_url text,
  created_at timestamptz not null default now()
);

create index on customers(tenant_id);

-- ─────────────────────────────────────────────────────────────
-- Sites (physical locations where workers deploy)
-- ─────────────────────────────────────────────────────────────
create table sites (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  geofence_radius_m integer not null default 150,
  site_qr_code text not null unique default ('site_' || uuid_generate_v4()::text),
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now()
);

create index on sites(customer_id);

-- ─────────────────────────────────────────────────────────────
-- Users (profile rows; auth.users is managed by Supabase Auth)
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  avatar_url text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now()
);

create index on profiles(tenant_id);

-- Role assignments (a user can have multiple scoped roles)
create table user_roles (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  role role not null,
  scope_kind scope_kind not null,
  scope_customer_id uuid references customers(id) on delete cascade,
  scope_site_id uuid references sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (scope_kind = 'global' and scope_customer_id is null and scope_site_id is null)
    or (scope_kind = 'customer' and scope_customer_id is not null and scope_site_id is null)
    or (scope_kind = 'site' and scope_site_id is not null)
  )
);

create index on user_roles(profile_id);
create index on user_roles(scope_site_id);
create index on user_roles(scope_customer_id);

-- ─────────────────────────────────────────────────────────────
-- Task templates (seeded from packages/domain/task-templates.ts)
-- ─────────────────────────────────────────────────────────────
create table task_templates (
  code text primary key,
  vertical vertical not null,
  label text not null,
  expected_minutes integer not null,
  requires_scan boolean not null default true,
  requires_photo boolean not null default false,
  billable boolean not null default false,
  billing_unit text
);

-- ─────────────────────────────────────────────────────────────
-- Shifts
-- ─────────────────────────────────────────────────────────────
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references profiles(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  clock_in_lat double precision,
  clock_in_lng double precision,
  status shift_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create index on shifts(worker_id);
create index on shifts(site_id, scheduled_start);

-- ─────────────────────────────────────────────────────────────
-- Tasks (instance of a template, assigned to a shift)
-- ─────────────────────────────────────────────────────────────
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid not null references shifts(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  template_code text not null references task_templates(code),
  target_ref text,
  status task_status not null default 'assigned',
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer generated always as (
    case when completed_at is not null and started_at is not null
      then extract(epoch from (completed_at - started_at))::integer
      else null
    end
  ) stored,
  quantity integer,
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

create index on tasks(shift_id);
create index on tasks(site_id, status);

-- ─────────────────────────────────────────────────────────────
-- Task events (append-only audit log)
-- ─────────────────────────────────────────────────────────────
create table task_events (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  actor_id uuid not null references profiles(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create index on task_events(task_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Scan codes (barcode/QR → entity)
-- ─────────────────────────────────────────────────────────────
create table scan_codes (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid not null references sites(id) on delete cascade,
  code text not null,
  entity_kind text not null,
  entity_ref text not null,
  created_at timestamptz not null default now(),
  unique (site_id, code)
);

create index on scan_codes(site_id);

-- ─────────────────────────────────────────────────────────────
-- Incidents
-- ─────────────────────────────────────────────────────────────
create table incidents (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid not null references sites(id) on delete cascade,
  reporter_id uuid not null references profiles(id),
  category text not null,
  severity text not null default 'low',
  description text,
  photo_url text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index on incidents(site_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Billing lines (derived nightly from task events)
-- ─────────────────────────────────────────────────────────────
create table billing_lines (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  bill_date date not null,
  unit_type text not null,
  unit_count integer not null,
  worker_hours numeric(10,2) not null default 0,
  rate_code text,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  unique (customer_id, site_id, bill_date, unit_type, rate_code)
);

create index on billing_lines(customer_id, bill_date);

-- ─────────────────────────────────────────────────────────────
-- Daily metrics rollup
-- ─────────────────────────────────────────────────────────────
create table metrics_daily (
  id uuid primary key default uuid_generate_v4(),
  metric_date date not null,
  site_id uuid references sites(id) on delete cascade,
  worker_id uuid references profiles(id) on delete cascade,
  vertical vertical,
  tasks_done integer not null default 0,
  tasks_blocked integer not null default 0,
  total_worker_hours numeric(10,2) not null default 0,
  billable_units integer not null default 0,
  created_at timestamptz not null default now()
);

create index on metrics_daily(metric_date, site_id);

-- ─────────────────────────────────────────────────────────────
-- Helper views + functions for RLS
-- ─────────────────────────────────────────────────────────────
create or replace function current_profile_id() returns uuid
language sql stable security definer as $$
  select id from profiles where id = auth.uid() limit 1;
$$;

create or replace function has_role(target_role role) returns boolean
language sql stable security definer as $$
  select exists(
    select 1 from user_roles
    where profile_id = auth.uid() and role = target_role
  );
$$;

create or replace function has_site_access(target_site_id uuid) returns boolean
language sql stable security definer as $$
  select exists(
    select 1 from user_roles ur
    left join sites s on s.id = target_site_id
    where ur.profile_id = auth.uid()
      and (
        ur.scope_kind = 'global'
        or (ur.scope_kind = 'customer' and ur.scope_customer_id = s.customer_id)
        or (ur.scope_kind = 'site' and ur.scope_site_id = target_site_id)
      )
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table tenants enable row level security;
alter table customers enable row level security;
alter table sites enable row level security;
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table task_templates enable row level security;
alter table shifts enable row level security;
alter table tasks enable row level security;
alter table task_events enable row level security;
alter table scan_codes enable row level security;
alter table incidents enable row level security;
alter table billing_lines enable row level security;
alter table metrics_daily enable row level security;

-- Profiles: users see themselves + anyone in their accessible sites
create policy "profiles_self" on profiles for select
  using (id = auth.uid() or has_role('super_admin') or has_role('rvp'));

create policy "profiles_update_self" on profiles for update
  using (id = auth.uid());

-- Sites: scoped access
create policy "sites_select" on sites for select
  using (has_site_access(id));

-- Shifts: worker sees own, managers see sites they access
create policy "shifts_select" on shifts for select
  using (
    worker_id = auth.uid()
    or has_site_access(site_id)
  );

create policy "shifts_insert_self" on shifts for insert
  with check (worker_id = auth.uid() or has_site_access(site_id));

create policy "shifts_update_self" on shifts for update
  using (worker_id = auth.uid() or has_site_access(site_id));

-- Tasks: same shift rules
create policy "tasks_select" on tasks for select
  using (
    exists (select 1 from shifts s where s.id = tasks.shift_id and s.worker_id = auth.uid())
    or has_site_access(site_id)
  );

create policy "tasks_update" on tasks for update
  using (
    exists (select 1 from shifts s where s.id = tasks.shift_id and s.worker_id = auth.uid())
    or has_site_access(site_id)
  );

-- Task events: write-only for the actor, read for site access
create policy "task_events_insert" on task_events for insert
  with check (actor_id = auth.uid());

create policy "task_events_select" on task_events for select
  using (
    actor_id = auth.uid()
    or exists (
      select 1 from tasks t where t.id = task_events.task_id and has_site_access(t.site_id)
    )
  );

-- Task templates: anyone authenticated can read
create policy "task_templates_select" on task_templates for select
  using (auth.uid() is not null);

-- Scan codes: site-scoped
create policy "scan_codes_select" on scan_codes for select
  using (has_site_access(site_id));

-- Incidents: site-scoped read, anyone on site can insert
create policy "incidents_select" on incidents for select
  using (has_site_access(site_id));

create policy "incidents_insert" on incidents for insert
  with check (reporter_id = auth.uid());

-- Billing lines: customer-scoped read for managers
create policy "billing_lines_select" on billing_lines for select
  using (
    has_role('super_admin')
    or has_role('rvp')
    or exists (
      select 1 from user_roles ur
      where ur.profile_id = auth.uid()
        and ur.scope_kind = 'customer'
        and ur.scope_customer_id = billing_lines.customer_id
    )
  );

-- Metrics: anyone with site access can read
create policy "metrics_daily_select" on metrics_daily for select
  using (site_id is null or has_site_access(site_id));
