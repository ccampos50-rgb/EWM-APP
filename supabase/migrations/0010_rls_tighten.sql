-- 0010 — Tighten RLS so non-super-admin roles can't see/modify cross-scope data.
--
-- Issues fixed:
--   1. pay_periods_select: area_manager could see pay_periods across tenants
--   2. worker_wages_select: area_manager could see wages across tenants
--   3. shift_overrides_insert: site_manager shortcut bypassed has_site_access
--   4. sites_insert: area_manager could create sites under any customer
--
-- Helper: my_tenant_id() — returns the actor's tenant_id from their profile.
-- SECURITY DEFINER so it can read profiles bypassing RLS during the policy check.

create or replace function my_tenant_id() returns uuid
language sql stable security definer
as $$
  select tenant_id from profiles where id = auth.uid()
$$;

-- ── 1. pay_periods: tenant-scope the read --------------------------------
drop policy if exists "pay_periods_select" on pay_periods;
create policy "pay_periods_select" on pay_periods for select
  using (
    has_role('super_admin') or has_role('rvp')
    or (has_role('area_manager') and tenant_id = my_tenant_id())
  );

-- ── 2. worker_wages: tenant-scope via the worker's profile ---------------
drop policy if exists "worker_wages_select" on worker_wages;
create policy "worker_wages_select" on worker_wages for select
  using (
    has_role('super_admin') or has_role('rvp')
    or profile_id = auth.uid()
    or (
      has_role('area_manager')
      and exists (
        select 1 from profiles p
        where p.id = worker_wages.profile_id
          and p.tenant_id = my_tenant_id()
      )
    )
  );

-- ── 3. shift_overrides: drop has_role shortcuts, require site access -----
drop policy if exists "shift_overrides_insert" on shift_overrides;
create policy "shift_overrides_insert" on shift_overrides for insert
  with check (
    supervisor_id = auth.uid()
    and (
      has_role('super_admin') or has_role('rvp')
      or exists (
        select 1 from shifts s
        where s.id = shift_overrides.shift_id
          and has_site_access(s.site_id)
      )
    )
  );

-- ── 4. sites_insert: area_manager must scope to their customer -----------
drop policy if exists "sites_insert" on sites;
create policy "sites_insert" on sites for insert
  with check (
    has_role('super_admin') or has_role('rvp')
    or (
      has_role('area_manager')
      and exists (
        select 1 from user_roles ur
        where ur.profile_id = auth.uid()
          and ur.role = 'area_manager'
          and ur.scope_kind = 'customer'
          and ur.scope_customer_id = sites.customer_id
      )
    )
  );
