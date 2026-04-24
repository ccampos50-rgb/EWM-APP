# EWM Pilot Rollout Guide

Use this to run your first pilot site end-to-end. ~2 hour setup, 1 shift to validate.

## Pre-flight (1 day before)

**Customer onboarding (super admin)**
1. `/sites` → add new site with the customer's info: name, address, lat/lng, geofence radius (default 150m works for most hotels)
2. Decide the vertical (hospitality / healthcare / mobility / light_industrial). Task templates are scoped to vertical.
3. `/sites/<id>/qr` → **Print QR codes** — prints a sheet with:
   - Site QR (post at the entrance)
   - One QR per room / bed / vehicle / zone
   Laminate if possible. Use Avery 5163 label stock if printing stickers.

**Worker onboarding**
1. Get the worker's phone number + preferred language
2. Create their auth user in Supabase Authentication → Users (✅ Auto Confirm)
3. Run this SQL in SQL Editor to set up their profile + role (replace email + name):
   ```sql
   insert into profiles (id, tenant_id, full_name, email, preferred_language)
   select u.id, '00000000-0000-0000-0000-000000000001', 'Worker Name', u.email, 'en'
   from auth.users u where u.email = 'worker@example.com'
   on conflict (id) do nothing;

   insert into user_roles (profile_id, role, scope_kind, scope_site_id)
   select u.id, 'worker', 'site', '<site-id>'
   from auth.users u where u.email = 'worker@example.com'
   on conflict do nothing;
   ```
4. Text them the Expo dev URL (or TestFlight invite once you publish)
5. They log in → first run shows the 3-slide walkthrough → lands on Sites

**Site manager onboarding**
- Same as worker but role is `site_manager` and scope stays `site`
- They use the admin portal (not the mobile app) to see the live board

## Go-day

**Morning (before shift)**
1. Site manager opens **Live board** (`/sites/<id>/live`) on a tablet at the supervisor desk
2. Schedule today's shifts: `/sites/<id>/new-shift` → pick worker, start/end times, select task templates → Create
3. Post printed QR codes at each room/asset if not already done

**During shift**
- Worker arrives → opens app → selects site → taps **Clock in** → geo-fence validates → gets task list
- Worker taps a task → scans the room QR → starts → does the work → scans again to complete → moves to next
- Site manager watches the **Live board** — sees names, current tasks, elapsed time, red flag when over expected duration
- If geo-fence fails for a legit reason: site manager goes to `/sites/<id>/shifts/<id>/override` → **Force clock-in** + reason → audit logged

**End of shift**
- Worker taps **Clock out** → confirms if tasks are still open → back to Sites
- Site manager reviews **Live board** — all tasks done, no red flags ideally

## First-week checks

**Daily (site manager, ~15 min)**
- Review `/reports?days=1` for anomalies: templates running over target, blocked tasks, incidents
- Clear incident backlog — walk through the site if supply shortages were reported

**Weekly (area manager, ~30 min)**
- `/overview` to spot-check completion % across sites
- `/reports?days=7` for template variance trends — if a template is consistently 20%+ over, the time estimate is wrong (edit the template) or there's a training gap
- `/billing` to preview what's about to invoice — spot any obviously wrong counts before export

## Things to demo for EWM leadership

**5-minute demo script**
1. Show **Sites list** — "every customer location lives here"
2. Open Grand Demo Hotel → show **today's shifts** — "the site manager sees everything in one place"
3. Click **Live board** → "this auto-updates as workers scan. Red flag = slow task."
4. Click **Reassign** on a task → "we can redeploy mid-shift"
5. Click **Override** → "if geo-fence misfires or someone no-shows, we log it with reason code"
6. Show **Reports** — "weekly trends, template performance, incidents"
7. Show **Billing** — "clean lines ready for invoicing, per-unit rates per customer"
8. Show **Audit** — "every scan, every status change, append-only"

**15-minute demo script** — same plus:
9. Open mobile app → clock in → scan a QR → complete a task → site manager's live board updates live
10. Report an incident from mobile → site manager sees it
11. Change language on login screen → show Spanish UI

## Known limitations for pilot

- **Realtime** uses Supabase's WebSocket publication. First reconnect after network hiccup can take 5-10s.
- **Offline scan queue** isn't wired yet — if network drops mid-shift, scans fail until reconnect. Mitigation: most hotels have basic wifi.
- **Email confirmation** is off for demo users. For production, turn it back on in Supabase Auth settings.
- **Push notifications** are registered but server-side send isn't wired yet. Workers won't get push pings for new tasks until we deploy the Edge Function for that.

## Metrics to capture from the pilot

Track these for the post-pilot debrief with EWM:
1. **Completion %** per day (target: 95%+)
2. **Average minutes per room** vs. template expected (target: within ±15%)
3. **Time to clock-in** from arrival (anecdotal, ask workers)
4. **Geo-fence success rate** (count of overrides / total shifts)
5. **Incident volume** and categories
6. **Site manager time on board vs. floor** (anecdotal)
7. **Worker sentiment** — short Spanish-friendly survey at end of week

## If things go wrong

| Symptom | Fix |
|---|---|
| Worker can't clock in, "too far" error | Site manager: `/shifts/<id>/override` → Force clock-in |
| Worker can't log in | Check Supabase Authentication → Users page; reset password if needed |
| Live board not updating | Refresh; check Supabase Realtime publication is enabled (migration 0002) |
| Tasks not appearing | Verify shift was created via `/new-shift` and tasks got linked |
| Photo upload fails | Check `task-photos` Storage bucket RLS; workers upload to `{uid}/` prefix |
| Spanish text garbled | Confirm `preferred_language='es'` on profile + device locale; fallback is English |

## Escalation

- Tech issue: check `/audit` for the last event + payload, screenshot, send to the build team
- Customer issue (real-world problem at the hotel): site manager files an incident via mobile or calls area manager directly — separate from the app's incident feature
- Billing dispute: area manager opens `/billing`, flags the line, notes the dispute — then manually resolve with customer before next export
