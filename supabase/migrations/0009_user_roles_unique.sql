-- 0009 — Dedupe user_roles + add UNIQUE so future inserts can't create duplicates.
--
-- Background: 0001 has no UNIQUE constraint on user_roles, which means
-- "INSERT ... ON CONFLICT DO NOTHING" silently inserts duplicates. We saw this
-- bite during the pilot seed (Josh + Pavi each ended up with two worker rows).

-- 1) Dedupe existing rows: keep the oldest row per (profile, role, scope)
delete from user_roles ur
using user_roles older
where older.profile_id = ur.profile_id
  and older.role = ur.role
  and coalesce(older.scope_kind::text, '') = coalesce(ur.scope_kind::text, '')
  and older.scope_customer_id is not distinct from ur.scope_customer_id
  and older.scope_site_id is not distinct from ur.scope_site_id
  and older.created_at < ur.created_at;

-- 2) Add UNIQUE constraint. Using a partial unique index because scope nullability
--    differs by scope_kind (global → both null, customer → customer set, site → site set).
create unique index if not exists user_roles_unique_global
  on user_roles (profile_id, role)
  where scope_kind = 'global';

create unique index if not exists user_roles_unique_customer
  on user_roles (profile_id, role, scope_customer_id)
  where scope_kind = 'customer';

create unique index if not exists user_roles_unique_site
  on user_roles (profile_id, role, scope_site_id)
  where scope_kind = 'site';
