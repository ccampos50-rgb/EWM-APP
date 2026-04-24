-- Week 6: supervisor override tracking
--   - shift_overrides table: one row per supervisor action with reason code + note
--   - reason code enum + audit trail

create type shift_override_kind as enum (
  'force_clock_in',       -- geo-fence failed, supervisor manually clocked worker in
  'force_clock_out',      -- worker left without clocking out
  'no_show',              -- worker didn't arrive
  'early_release',        -- worker released before scheduled end
  'other'
);

create table shift_overrides (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid not null references shifts(id) on delete cascade,
  supervisor_id uuid not null references profiles(id),
  kind shift_override_kind not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index on shift_overrides(shift_id);
create index on shift_overrides(supervisor_id, created_at desc);

alter table shift_overrides enable row level security;

create policy "shift_overrides_select" on shift_overrides for select
  using (
    has_role('super_admin') or has_role('rvp')
    or exists (
      select 1 from shifts s
      where s.id = shift_overrides.shift_id
        and (s.worker_id = auth.uid() or has_site_access(s.site_id))
    )
  );

create policy "shift_overrides_insert" on shift_overrides for insert
  with check (
    supervisor_id = auth.uid()
    and (
      has_role('super_admin') or has_role('rvp') or has_role('area_manager') or has_role('site_manager')
      or exists (
        select 1 from shifts s
        where s.id = shift_overrides.shift_id and has_site_access(s.site_id)
      )
    )
  );
