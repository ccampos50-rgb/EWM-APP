-- Optional cleanup: remove demo_workforce.sql residue from the Josh Inn site.
-- Keep only the 15 named pilot workers (*.ewm-pilot.test) and their shifts/tasks.
-- Re-runnable. Reversible only by re-seeding from demo_workforce.sql.

do $do$
declare
  demo_site_id constant uuid := '00000000-0000-0000-0000-000000000200';
  pilot_email_pattern constant text := '%@ewm-pilot.test';
  ghost_count int;
begin
  -- Pilot worker IDs (the 15 we care about)
  -- Drop shifts at the demo site whose worker is NOT one of the pilot accounts.
  with pilot_ids as (
    select id from profiles where email like pilot_email_pattern
  ), to_delete as (
    delete from shifts s
    where s.site_id = demo_site_id
      and s.worker_id not in (select id from pilot_ids)
    returning s.id
  )
  select count(*) into ghost_count from to_delete;

  raise notice 'Deleted % ghost shifts (demo workforce residue).', ghost_count;

  -- Tasks ON CASCADE DELETE with shifts, so they're gone automatically.
  -- Drop demo profiles that have NO remaining shift/role assignments and are not pilot accounts.
  delete from profiles p
  where p.email not like pilot_email_pattern
    and p.email != 'ccampos50@gmail.com'
    and not exists (select 1 from shifts where worker_id = p.id)
    and not exists (select 1 from user_roles where profile_id = p.id);

  raise notice 'Deleted orphan demo profiles.';
end;
$do$;

-- Verification: should show 15 distinct workers, 30 shifts, 150 tasks
select
  (select count(distinct ur.profile_id) from user_roles ur
    where ur.role = 'worker' and ur.scope_site_id = '00000000-0000-0000-0000-000000000200') as workers,
  (select count(*) from shifts where site_id = '00000000-0000-0000-0000-000000000200') as shifts,
  (select count(*) from tasks where site_id = '00000000-0000-0000-0000-000000000200') as tasks;
