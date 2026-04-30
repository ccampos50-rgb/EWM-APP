-- 0013 — Add 'customer' role for customer-side users (e.g., a hotel GM seeing their data)
--
-- The customer role is read-only for the customer's own data:
--   • their customers row
--   • sites belonging to that customer (via existing scope_customer_id check)
--   • worker rosters at those sites
--   • billing_lines + customer_rates (already scope-checked)
--   • photos at their sites (storage policy via has_site_access)
--
-- They CANNOT modify schedules, create workers, or see other customers.
-- Existing customer_rates_select / customers_select / has_site_access already
-- grant read where (user_roles.scope_kind = 'customer' AND scope_customer_id matches),
-- so adding the enum value + assigning a user_role is sufficient.

alter type role add value if not exists 'customer';
