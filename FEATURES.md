# Features by Role

## Field Worker (mobile app)

**Onboarding**
- Phone OTP login (Twilio via Tom's existing infra)
- One-time: grant location + camera permissions
- Profile: name, photo, languages spoken

**Clock in**
- Pick today's assigned site from list (or scan site QR posted at facility)
- Geo-fence check confirms worker is physically on site
- Clock-in timestamp recorded; shift starts

**Task flow**
- Home screen: today's task list, ordered by priority
- Tap task → see instructions (text + optional reference photo)
- Scan the asset (room QR, wristband, VIN, tote) to mark "in progress"
- Scan again or tap "Done" to complete, optional photo proof
- Optional: quantity entry (e.g., PM oil quarts/filters), free-text notes

**Clock out**
- Tap clock-out → confirms all tasks resolved or flagged incomplete
- Shift summary: tasks done, time on site, next scheduled shift

**Other**
- Multilingual UI (English + Spanish v1)
- Offline-tolerant: queued scans sync on reconnect
- Incident report: quick form + photo if something's broken/unsafe

## Site Manager (web, tablet-optimized)

**Live team board**
- Real-time list of workers clocked in at this site
- Each row: worker name, current task, minutes on task, last scan time
- Color coding: green on pace / yellow slowing / red over target duration
- Kanban of tasks: Assigned / In Progress / Done

**Task management**
- Create ad-hoc tasks from templates (e.g., VIP room rush)
- Reassign a task from worker A to worker B
- Mark a task blocked (supply out, equipment down) → triggers incident

**Shift oversight**
- See who's late / no-show → flag to Area Manager
- Override clock-in if geo-fence misfires (with reason code)

**Incidents & audit**
- Log incidents (injury, property damage, client complaint)
- View full scan/event log for any task (audit trail)

## Area Manager (web)

**Multi-site overview**
- All sites under their scope, with live headcount + completion %
- Drill into any site → Site Manager view
- Cross-site staffing: see gaps, redeploy from overstaffed site

**Reports**
- Labor cost vs. transaction volume per site per day/week
- Worker productivity rankings (rooms/hour, transports/hour, etc.)
- Template performance: which task templates run over target duration?

**People**
- Worker roster per site
- Assign workers to sites
- Approve Site Manager override requests

## RVP (web)

**Regional dashboards**
- Multi-customer, multi-site P&L proxy (labor $ per billable unit)
- Trend charts: productivity, incidents, labor spend, surge utilization
- Customer health: which customers are hitting contract SLAs?

**Executive reports**
- Weekly/monthly PDF export
- Board-ready charts

## EWM Super Admin

- Tenant/customer onboarding (add Hotel X, set contract rates)
- Site setup: address, geo-fence radius, print site QR code
- Vertical template authoring: create/edit task templates per vertical
- User management across all roles
- Billing export config per customer (CSV schedule, webhook URL, rate codes)
- Feature flags per customer (e.g., photo proof required? offline allowed?)

## Cross-cutting features

- **Notifications**
  - Push to worker: new task, shift reminder, clock-out warning
  - Push/SMS to Site Manager: worker late, task blocked, incident
  - Email to Area Manager/RVP: daily/weekly digest

- **Audit log**
  - Every scan, status change, override, and incident is append-only logged with user + timestamp + geo
  - Exportable for compliance (esp. healthcare)

- **Billing**
  - Nightly CSV export per customer
  - Webhook POST to EWM invoicing system
  - Dispute workflow: flag a billing line, add note, Area Manager resolves
