-- Week 6: schedule the billing-rollup Edge Function nightly via pg_cron + pg_net
--
-- Requirements (already on Supabase Pro/Team plans):
--   - pg_cron extension (cron schema)
--   - pg_net extension (net schema) for HTTP calls
--   - SUPABASE_ANON_KEY accessible — paste yours into the script below before running

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace YOUR_ANON_KEY_HERE with the publishable/anon key from Supabase Project Settings → API Keys.
-- (Same key as in your apps/admin/.env.local NEXT_PUBLIC_SUPABASE_ANON_KEY.)
--
-- Schedule: nightly at 02:00 UTC (= 21:00 CDT / 22:00 EDT). Adjust as desired.
select cron.schedule(
  'billing-rollup-nightly',
  '0 2 * * *',
  $$
  select net.http_post(
    url := 'https://pbhtuyjigpldvcztepss.supabase.co/functions/v1/billing-rollup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY_HERE'
    ),
    body := jsonb_build_object('triggered_by', 'cron')
  ) as request_id;
  $$
);

-- Verify the job was scheduled:
-- select * from cron.job where jobname = 'billing-rollup-nightly';

-- To unschedule later:
-- select cron.unschedule('billing-rollup-nightly');
