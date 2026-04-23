-- Week 3 follow-up: fill in missing RLS policies exposed during end-to-end testing.
--
-- The initial migration (0001) added enable-RLS on many tables but forgot the
-- matching policies, which silently denies all reads/writes to those tables
-- through the API. Covers: tenants, customers, user_roles, profiles INSERT,
-- tasks INSERT, task_templates mgmt, sites mgmt, scan_codes mgmt.

-- ─────────────────────────────────────────────────────────────
-- Tenants: super_admin/rvp can see all; everyone else sees nothing
-- ─────────────────────────────────────────────────────────────
create policy "tenants_select" on tenants for select
  using (has_role('super_admin') or has_role('rvp'));

create policy "tenants_insert" on tenants for insert
  with check (has_role('super_admin'));

create policy "tenants_update" on tenants for update
  using (has_role('super_admin'));

-- ─────────────────────────────────────────────────────────────
-- Customers: anyone who can see a site should be able to see its customer
-- ─────────────────────────────────────────────────────────────
create policy "customers_select" on customers for select
  using (
    has_role('super_admin')
    or has_role('rvp')
    or exists (select 1 from user_roles ur
               where ur.profile_id = auth.uid()
                 and ur.scope_kind = 'customer' and ur.scope_customer_id = customers.id)
    or exists (select 1 from sites s
               where s.customer_id = customers.id and has_site_access(s.id))
  );

create policy "customers_insert" on customers for insert
  with check (has_role('super_admin') or has_role('rvp'));

create policy "customers_update" on customers for update
  using (has_role('super_admin') or has_role('rvp'));

-- ─────────────────────────────────────────────────────────────
-- Sites: keep existing select; add write for super_admin/rvp/area_manager
-- ─────────────────────────────────────────────────────────────
create policy "sites_insert" on sites for insert
  with check (has_role('super_admin') or has_role('rvp') or has_role('area_manager'));

create policy "sites_update" on sites for update
  using (
    has_role('super_admin') or has_role('rvp')
    or (has_role('area_manager') and has_site_access(id))
  );

-- ─────────────────────────────────────────────────────────────
-- Profiles: add INSERT for super_admin; reads for anyone with site overlap
-- ─────────────────────────────────────────────────────────────
create policy "profiles_insert_admin" on profiles for insert
  with check (has_role('super_admin') or id = auth.uid());

create policy "profiles_select_same_site" on profiles for select
  using (
    exists (
      select 1
      from user_roles me, user_roles them
      where me.profile_id = auth.uid()
        and them.profile_id = profiles.id
        and (
          (me.scope_kind = 'site' and them.scope_kind = 'site' and me.scope_site_id = them.scope_site_id)
          or (me.scope_kind = 'customer' and them.scope_kind = 'site'
              and them.scope_site_id in (select id from sites where customer_id = me.scope_customer_id))
          or (me.scope_kind in ('customer','site') and them.scope_kind = 'customer'
              and me.scope_customer_id = them.scope_customer_id)
        )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- user_roles: visible to super_admin/rvp + self; writable by super_admin
-- ─────────────────────────────────────────────────────────────
create policy "user_roles_select_self_or_admin" on user_roles for select
  using (profile_id = auth.uid() or has_role('super_admin') or has_role('rvp'));

create policy "user_roles_insert" on user_roles for insert
  with check (has_role('super_admin'));

create policy "user_roles_update" on user_roles for update
  using (has_role('super_admin'));

create policy "user_roles_delete" on user_roles for delete
  using (has_role('super_admin'));

-- ─────────────────────────────────────────────────────────────
-- Task templates: writable by super_admin (adding new verticals/templates)
-- ─────────────────────────────────────────────────────────────
create policy "task_templates_insert" on task_templates for insert
  with check (has_role('super_admin'));

create policy "task_templates_update" on task_templates for update
  using (has_role('super_admin'));

-- ─────────────────────────────────────────────────────────────
-- Tasks: add INSERT + DELETE for anyone who can access the site (managers)
-- (SELECT + UPDATE already exist)
-- ─────────────────────────────────────────────────────────────
create policy "tasks_insert" on tasks for insert
  with check (
    has_site_access(site_id)
    or exists (select 1 from shifts s where s.id = tasks.shift_id and s.worker_id = auth.uid())
  );

create policy "tasks_delete" on tasks for delete
  using (has_site_access(site_id));

-- ─────────────────────────────────────────────────────────────
-- Shifts: add DELETE (INSERT + UPDATE already exist)
-- ─────────────────────────────────────────────────────────────
create policy "shifts_delete" on shifts for delete
  using (has_site_access(site_id) or has_role('super_admin'));

-- ─────────────────────────────────────────────────────────────
-- Scan codes: add write for super_admin + site_manager
-- ─────────────────────────────────────────────────────────────
create policy "scan_codes_insert" on scan_codes for insert
  with check (has_site_access(site_id));

create policy "scan_codes_update" on scan_codes for update
  using (has_site_access(site_id));

create policy "scan_codes_delete" on scan_codes for delete
  using (has_site_access(site_id));

-- ─────────────────────────────────────────────────────────────
-- Billing lines: insert allowed for super_admin (Edge Function / rollup job)
-- ─────────────────────────────────────────────────────────────
create policy "billing_lines_insert" on billing_lines for insert
  with check (has_role('super_admin'));

create policy "billing_lines_update" on billing_lines for update
  using (has_role('super_admin'));

-- ─────────────────────────────────────────────────────────────
-- Metrics daily: writable by super_admin (rollup)
-- ─────────────────────────────────────────────────────────────
create policy "metrics_daily_insert" on metrics_daily for insert
  with check (has_role('super_admin'));

create policy "metrics_daily_update" on metrics_daily for update
  using (has_role('super_admin'));
