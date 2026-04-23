-- Week 4: billing export infrastructure
--   - Dedicated Storage bucket for billing CSV exports
--   - customer_rates table (per-customer unit pricing for billable task types)
--   - billing_lines extension (amount_cents column)

-- ─────────────────────────────────────────────────────────────
-- Storage: billing-exports bucket (private, JSON/CSV only)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'billing-exports',
  'billing-exports',
  false,
  50 * 1024 * 1024,
  array['text/csv', 'application/json']
)
on conflict (id) do nothing;

-- Only super_admin/rvp can list/download billing exports
create policy "billing_exports_admin_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'billing-exports'
    and (has_role('super_admin') or has_role('rvp'))
  );

create policy "billing_exports_service_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'billing-exports' and has_role('super_admin'));

-- ─────────────────────────────────────────────────────────────
-- Customer rates (per-customer price per billable unit)
-- ─────────────────────────────────────────────────────────────
create table customer_rates (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  unit_type text not null,                 -- matches task_templates.billing_unit (room, bed, vehicle, etc.)
  rate_code text not null,                 -- e.g. 'standard', 'weekend', 'surge'
  unit_price_cents integer not null,       -- price per unit in cents (so $4.50 → 450)
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  unique (customer_id, unit_type, rate_code, effective_from)
);

create index on customer_rates(customer_id, unit_type);

alter table customer_rates enable row level security;

create policy "customer_rates_select" on customer_rates for select
  using (
    has_role('super_admin') or has_role('rvp')
    or exists (select 1 from user_roles ur
               where ur.profile_id = auth.uid()
                 and ur.scope_kind = 'customer'
                 and ur.scope_customer_id = customer_rates.customer_id)
  );

create policy "customer_rates_write" on customer_rates for all
  using (has_role('super_admin') or has_role('rvp'))
  with check (has_role('super_admin') or has_role('rvp'));

-- ─────────────────────────────────────────────────────────────
-- Extend billing_lines with amount_cents (computed from rate × count)
-- ─────────────────────────────────────────────────────────────
alter table billing_lines add column if not exists amount_cents integer;

-- Seed a default standard rate for the demo hotel
insert into customer_rates (customer_id, unit_type, rate_code, unit_price_cents)
values
  ('00000000-0000-0000-0000-000000000100', 'room', 'standard', 450),    -- $4.50/room
  ('00000000-0000-0000-0000-000000000100', 'event', 'standard', 7500),  -- $75/event
  ('00000000-0000-0000-0000-000000000100', 'bed', 'standard', 850)      -- $8.50/bed (hospital)
on conflict do nothing;
