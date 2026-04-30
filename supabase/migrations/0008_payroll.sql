-- 0008 — Payroll
--   - worker_wages: per-worker hourly rate, history-aware (effective_from / effective_to)
--   - pay_periods: weekly buckets in the tenant's timezone, lifecycle open → locked → paid
--   - has_role() helper is reused from 0001 for RLS

-- ─────────────────────────────────────────────────────────────
-- Worker wages (one rate per worker, effective-dated)
-- ─────────────────────────────────────────────────────────────
create table if not exists worker_wages (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  hourly_rate_cents integer not null check (hourly_rate_cents >= 0),
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  check (effective_to is null or effective_to >= effective_from)
);

create index if not exists worker_wages_profile_idx
  on worker_wages(profile_id, effective_from desc);

alter table worker_wages enable row level security;

-- Read: super_admin, rvp, area_manager, or the worker themselves
create policy "worker_wages_select" on worker_wages for select
  using (
    has_role('super_admin') or has_role('rvp') or has_role('area_manager')
    or profile_id = auth.uid()
  );

-- Write: super_admin or rvp only (not the worker, not site managers)
create policy "worker_wages_write" on worker_wages for all
  using (has_role('super_admin') or has_role('rvp'))
  with check (has_role('super_admin') or has_role('rvp'));

-- ─────────────────────────────────────────────────────────────
-- Pay periods (weekly buckets per tenant)
-- Lifecycle: open (editable) → locked (frozen, ready to pay) → paid (settled)
-- ─────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'pay_period_status') then
    create type pay_period_status as enum ('open', 'locked', 'paid');
  end if;
end $$;

create table if not exists pay_periods (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  status pay_period_status not null default 'open',
  locked_at timestamptz,
  locked_by uuid references profiles(id),
  paid_at timestamptz,
  paid_by uuid references profiles(id),
  paid_note text,
  created_at timestamptz not null default now(),
  unique (tenant_id, starts_on),
  check (ends_on > starts_on)
);

create index if not exists pay_periods_tenant_starts_idx
  on pay_periods(tenant_id, starts_on desc);

alter table pay_periods enable row level security;

create policy "pay_periods_select" on pay_periods for select
  using (
    has_role('super_admin') or has_role('rvp') or has_role('area_manager')
  );

create policy "pay_periods_write" on pay_periods for all
  using (has_role('super_admin') or has_role('rvp'))
  with check (has_role('super_admin') or has_role('rvp'));
