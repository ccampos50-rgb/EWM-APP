# Roadmap — 4–6 Week MVP

Target: one hospitality pilot site, real workers, clean billing data flowing to EWM invoicing.

## Week 0 — Prep (before coding)

- [ ] Provision new Supabase project (dedicated, not shared with Tom)
- [ ] Set up Vercel project for admin
- [ ] Set up Expo project + App Store / Play Store dev accounts (iOS signing takes a week, start now)
- [ ] Seed a fictional demo customer + site for development (no real pilot customer yet)

Deferred (will tackle once v1 is demo-ready):
- Real pilot customer selection
- EWM brand asset pack (using generic placeholders for v1)
- Twilio / SMS OTP

## Week 1 — Foundations

**Backend**
- Supabase schema: tenants, customers, sites, users, user_roles, verticals, task_templates, shifts, tasks, task_events, scan_codes
- RLS policies for all roles
- Seed data: EWM tenant, 1 hotel customer, 1 site, hospitality template pack

**Admin (web)**
- Next.js app scaffolded, Tailwind + shadcn/ui
- Auth: email + password (magic link optional) for all roles
- Role-based middleware
- Super Admin: tenant/customer/site CRUD

**Mobile**
- Expo project scaffolded
- Email/password login (phone OTP deferred)
- Home screen stub

## Week 2 — Worker happy path

**Mobile**
- Site picker + site QR scan
- Geo-fence validation on clock-in
- Today's task list (from assigned shift)
- Scan-to-start / scan-to-complete flow
- Clock out + shift summary
- Offline scan queue (SQLite)

**Admin**
- Site Manager: worker assignment UI
- Site Manager: today's task creation from template

## Week 3 — Live dashboard + reporting

**Admin**
- Site Manager live board (Supabase Realtime)
- Task kanban + reassignment
- Area Manager: multi-site overview
- Basic reports: labor $ vs. rooms cleaned

**Mobile**
- Photo proof on task complete
- Multilingual (Spanish) pass
- Incident report form

## Week 4 — Billing + polish

**Backend**
- Nightly rollup: task_events → billing_lines
- CSV export to Storage
- Webhook POST to EWM invoicing (stub endpoint if real one isn't ready)

**Admin**
- Billing export config per customer
- Audit log viewer
- Dispute workflow

**Mobile**
- Push notifications (new task, shift reminder)
- App icon, splash, final branding pass

## Week 5 — Demo-ready

- Deploy to TestFlight + Play Store internal track
- Generate site QR codes for the demo/fictional site
- Record a 5-min walkthrough video for EWM leadership
- Internal dry run: EWM team plays workers + site manager

## Week 6 — EWM review & pilot signoff

- Demo to EWM leadership
- Capture feedback, prioritize v1.1 fixes
- Identify real pilot customer + kick off pilot prep (brand assets, real site setup, Twilio for OTP if needed)

## Post-MVP (order TBD)

- Healthcare vertical pack (EVS + transport)
- Mobility vertical pack (MLS parity: PM, ready-line, VIN scans)
- Light industrial vertical pack
- Scheduling integration (import shifts from EWM's existing system)
- ATS/HRIS sync with Tom's onboarding data
- Manager mobile app (currently tablet-web; may want native)
- Advanced analytics: labor forecasting, demand prediction
- Multi-tenant: sell the platform to other staffing firms
