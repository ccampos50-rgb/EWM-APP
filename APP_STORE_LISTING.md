# EWM Workforce — App Store Listing

Drop these into App Store Connect → My Apps → EWM Workforce → App Store tab.

---

## App name (max 30 chars)

**EWM Workforce**

(15 chars — well under the limit, room for "EWM Workforce Pro" or similar later if you ever wanted)

---

## Subtitle (max 30 chars)

Pick one:

1. **Field workforce, on the clock.** *(31 chars — 1 over, would need trim)*
2. **Field shifts, tasks, and time.** *(30 — fits)*
3. **Workforce productivity, live.** *(29 — fits)*  ← *recommended*
4. **People. Performance. Elevated.** *(30 — fits, matches your tagline)*  ← *runner-up if you want brand-tagline reuse*

---

## Promotional text (max 170 chars, can change anytime without re-review)

> Real-time productivity tracking for hotels, hospitals, mobility, and light-industrial workforces. Clock in, scan, complete, and prove every task — from the field.

(168 chars)

---

## Description (max 4000 chars)

```
EWM Workforce is the field-side companion to the Elevated Workforce Management
productivity platform. Workers, supervisors, and customers stay on the same
page — what's scheduled, what's done, who's where, and what's billable.

WHAT YOU CAN DO

• Sign in once and see your day. Today's shift, your assigned site, and every
  task waiting for you, in English or Spanish.

• Clock in at the site. We use your phone's location only at the moment of
  clock-in to confirm you're inside the geo-fence your supervisor set up.
  Location is not tracked when you're off the clock.

• Scan to start, scan to complete. Each room, bed, vehicle, or zone has a
  printable QR code. Scan it to start a task, scan it again to mark it done.
  No paperwork.

• Photo proof. For tasks that need it (a cleaned room, a completed safety
  check), snap a photo right from the task screen. The photo lives with the
  record.

• Report incidents. Spill, no-show, broken equipment, security event. Pick a
  category, add a photo and a note, send. Site managers get it instantly.

• Bilingual. Every screen is fully translated into Spanish, with the language
  set per worker so a single team can use both at once.

WHO IT'S FOR

EWM Workforce is built for the four verticals Elevated Workforce Management
serves: hospitality (room cleans, room refresh, linen runs), healthcare
(EVS terminal cleans, patient transports, bed turnover), mobility (vehicle
prep, valet, rental ready-line), and light industrial (warehouse picks, zone
cleans, equipment checks). Every task type comes with its own expected time,
billing unit, and audit trail.

For workers, the app is meant to feel like a checklist with a stopwatch. For
supervisors, it's a live board. For customers, it's a billing audit trail
they can trust.

PRIVACY

We collect only what's needed to schedule, time, and bill the work you do.
No advertising. No third-party analytics. No background location tracking —
ever. Full details in our privacy policy at:
elevated-workforce.com/privacy.html

ABOUT EWM

Elevated Workforce Management is a Texas-based staffing firm specializing in
trained, supervised, productivity-tracked field labor. People. Performance.
Elevated.

Need help? support@elevated-workforce.com
```

(~1700 chars — well under 4000)

---

## Keywords (max 100 chars, comma-separated, no spaces after commas)

```
workforce,timeclock,housekeeping,hospitality,EVS,clock in,shift,task,QR,staffing,janitorial,team
```

(99 chars — fits)

Notes:
- Don't repeat words from the title/subtitle (Apple already indexes those).
- Singular forms preferred (Apple lemmatizes plurals).
- "EVS" and "QR" hit niche terms hospital and ops folks search for.

---

## Support URL

```
https://elevated-workforce.com
```

---

## Marketing URL (optional)

```
https://elevated-workforce.com
```

---

## Privacy policy URL (REQUIRED)

```
https://elevated-workforce.com/privacy.html
```

---

## Category

- **Primary**: Business
- **Secondary** (optional): Productivity

---

## Age rating

Walk through the questionnaire in App Store Connect. Expected answers for this app:

| Question | Answer |
|---|---|
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Sexual content / nudity | None |
| Profanity / crude humor | None |
| Alcohol, tobacco, drugs | None |
| Mature/suggestive themes | None |
| Horror/fear themes | None |
| Gambling | None |
| Contests | None |
| Unrestricted web access | No |
| User-generated content | **Yes** — workers can attach photos to tasks. (App Store requires moderation tooling for UGC; in our case the photos are private to the customer site, not public.) |
| Medical/treatment information | No |
| Personal data sharing in-app | Limited (between worker, supervisor, customer per the privacy policy) |

Result: **4+** age rating.

---

## App Privacy questionnaire (Data Types)

You'll fill this in App Store Connect → App Privacy. Here's the truth, ready to map onto Apple's checkboxes:

| Data category | Collected? | Linked to user? | Used for tracking? | Purpose |
|---|---|---|---|---|
| Contact info → Name | Yes | Yes | No | App functionality |
| Contact info → Email | Yes | Yes | No | App functionality |
| Contact info → Phone (optional) | Yes | Yes | No | App functionality |
| User content → Photos | Yes | Yes | No | App functionality (task proof) |
| Identifiers → User ID | Yes | Yes | No | App functionality |
| Location → Coarse Location | **Yes** | Yes | No | App functionality (geo-fence at clock-in only) |
| Location → Precise Location | **Yes** | Yes | No | App functionality (geo-fence at clock-in only) |
| Diagnostics → Crash Data | No | — | — | — |
| Diagnostics → Performance | No | — | — | — |
| Usage Data | No | — | — | — |
| Sensitive Info | No | — | — | — |
| Financial Info | No | — | — | — |
| Health & Fitness | No | — | — | — |
| Browsing/Search History | No | — | — | — |
| Purchases | No | — | — | — |

For the App Privacy "Tracking" section: **No tracking.** This app doesn't follow you across other companies' apps and websites; we don't share with data brokers; no advertising IDs are collected.

---

## Sign-in info for App Review

App Review will need to log into the app to verify it works. Use the existing pilot account:

| Field | Value |
|---|---|
| Username | `josh.motes@ewm-pilot.test` |
| Password | `EwmTest2026!` |

Notes for the reviewer (paste into the "Notes" field):

```
This app is a B2B workforce-management tool. To sign in, please use the
provided test account. The home screen shows the user's assigned site
("Josh Inn") with today's shift.

Geo-fence note: The clock-in flow uses location to verify the worker is
within their assigned site's geo-fence. The pilot site geo-fence is centered
in Frisco, Texas (33.1935, -96.812) with a 12 km radius covering Frisco and
Prosper, TX. From outside that radius (e.g. an Apple Review machine in
Cupertino), tapping "Clock In" will show a "you are not at the site" message
— this is correct behavior, not a bug.

For the reviewer to bypass the geo-fence and exercise the rest of the app
(tasks, scan, photo proof, clock-out), please simulate a location inside
the radius (e.g. iOS Simulator → Features → Location → Custom Location →
33.20, -96.80).
```

---

## Build to submit

Build **0.1.0 (12)** — the one in TestFlight with the proper EWM icon.

(Not 0.1.0 (11) — that's the placeholder-icon build, kept around as a fallback.)

---

## What's NOT in this listing yet (you provide)

- **Screenshots** — see SCREENSHOT_GUIDE.md
- **App preview video** — optional, can skip for v1

That's it for the listing.
