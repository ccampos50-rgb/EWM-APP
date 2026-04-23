# EWM Productivity App — Product Spec

## Problem

EWM deploys hourly workers (housekeepers, patient transporters, valets, warehouse associates) to client sites across four verticals. They sell on "real-time productivity tracking" but have no proprietary tool to deliver it — today this is manual supervision + spreadsheets. Clients pay on transaction-based pricing (per room, per bed, per hour), so EWM needs accurate, tamper-resistant task data tied to billing.

## Goals

1. **For workers** — a dead-simple mobile app: clock in at a site, see today's tasks, scan/confirm work done, clock out.
2. **For site managers** — a live-team dashboard at the client location showing who's on site, who's behind, where coverage is thin.
3. **For area managers + RVPs** — cross-site productivity reporting, labor-cost vs. transaction-volume views, surge coverage status.
4. **For EWM billing** — clean task/hour data exported to the invoicing system (per-room, per-bed, per-hour).

## Non-goals (v1)

- Scheduling/shift-bidding — assume shifts are set upstream (could integrate with existing EWM systems later).
- Payroll processing — hand off hours; don't pay checks.
- Full ATS/recruiting — that's Tom's job (the SMS agent).

## Key decisions (locked)

| # | Decision | Rationale |
|---|---|---|
| 1 | **Generic multi-vertical framework** | One codebase covers hospitality, healthcare, mobility, light industrial. Each vertical is a *task template pack*, not a forked app. |
| 2 | **Hybrid worker identity: geo-fence + site QR + login code** | Belt + suspenders. Geo-fence prevents buddy-punching; QR posted at site is fast; login code works as fallback. |
| 3 | **Any scan type supported** (QR, 1D barcodes, NFC optional later) | Clients hand us whatever asset tags they already use. `expo-barcode-scanner` handles both. |
| 4 | **Site Manager live dashboard is a first-class feature** | Differentiator vs. MLS. Tablet-optimized. On-site supervisor sees team status in real time. |
| 5 | **Billing integration from day one** (CSV export + webhook) | Transaction-based pricing is EWM's core value prop; numbers must land in invoicing clean. |
| 6 | **MVP in 4–6 weeks for one pilot customer** | One vertical pilot (likely hospitality), one site, real workers. Roll to other verticals after pilot data. |

## Roles & hierarchy

```
RVP (Regional VP)
  └─ Area Manager
       └─ Site Manager (on-site at client facility)
            └─ Field Worker (uses mobile app)
```

- **RVP / Area Manager** — web admin, cross-site views, labor metrics, trend reports
- **Site Manager** — web admin (tablet-optimized), live team board, task reassignment, incident logging
- **Field Worker** — mobile app only, task list, scan-to-complete, clock in/out
- **EWM Super Admin** — everything, plus tenant/customer onboarding, vertical template authoring

## Verticals — task template packs (v1)

### Hospitality (pilot)
- Task types: room clean (checkout, stayover, refresh), banquet setup, lobby detail, linen run
- Scannables: room number QR (on door frame), linen cart barcode, guest-request ticket QR
- Metrics: rooms per hour, minutes per room type, refresh completion rate

### Healthcare (EVS + transport)
- Task types: room turnover, patient transport, wheelchair dispatch, discharge cleaning
- Scannables: patient wristband, bed ID, wheelchair asset tag, room QR
- Metrics: minutes per transport, turnover time, compliance-ready audit log

### Mobility (auto/rental)
- Task types: car wash/detail, lot stage, fuel top-up, PM (fluids/filters — MLS parity), ready-line audit
- Scannables: VIN barcode, stall QR, fuel pump QR
- Metrics: vehicles prepped per shift, ready-line time, PM completion

### Light Industrial (warehouse)
- Task types: pick, pack, load, case count, putaway
- Scannables: tote barcode, pallet QR, zone QR
- Metrics: units per hour, pick accuracy, loading time

## Branding

- Use EWM logo (pull from `EWM_Website_Mockup.pdf` or request assets)
- Tagline: *People. Performance. Elevated.*
- Colors/fonts: **TODO** — extract from landing page audit PDFs or ask EWM for brand guide
- App icon: EWM mark (not MLS — we are not cloning their branding)

## Resolved

- **Pilot customer** — none yet; build generic demo-ready app with seed data representing a fictional hotel site. Real pilot slots in after v1 is demo-able.
- **Brand assets** — generic placeholder branding for v1 (see BRANDING.md). Swap in real EWM assets when they're provided.
- **Backend infra** — new Supabase project, not shared with Tom's SMS agent. Keeps concerns separate and avoids migrating Tom's data model.
- **Worker auth** — email + password (or magic link) for v1. Skip Twilio/phone OTP until there's a real pilot needing it.

## Still open

- Language support: Spanish for v1, or English-only to ship faster? (Lean English-only for v1.)
- Offline mode: confirmed as must-have (back-of-house signal is unreliable).
