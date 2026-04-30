# App Store screenshots — capture guide

Apple requires screenshots so reviewers and shoppers see what the app does. This is the only piece of the listing that needs your phone.

## What Apple actually requires

You only **strictly need** screenshots for the **6.7" iPhone display** (iPhone 15/16 Pro Max class). If you submit those, Apple auto-scales them down for older device classes. Optionally you can also submit:

- **6.5" iPhone** (iPhone 11 Pro Max / XS Max — older but some users still on these)
- **5.5" iPhone** (legacy, Apple stopped requiring this in 2023)
- **iPad** (only if your app supports tablets — `app.json` has `supportsTablet: true`, so we will need iPad screenshots eventually, but not for first submission)

**For the first submission, just do 6.7" iPhone.** ~10 minutes of work.

## Required spec for 6.7" iPhone

- **Dimensions**: 1290 × 2796 px (portrait) or 2796 × 1290 (landscape)
- **Format**: PNG or JPG
- **Color space**: sRGB or P3
- **Minimum**: 3 screenshots
- **Maximum**: 10 screenshots
- **No transparency** (no alpha channel)

If you take screenshots on an **iPhone 15 Pro Max, 16 Pro Max, or any 6.7"+ Pro Max model** (which gives the native 1290 × 2796), they're already the right size — just export as PNG.

If you take screenshots on a smaller iPhone (e.g. regular 15/16 Pro), the native size will be smaller and Apple may or may not accept them. Two ways out:

1. **Use the iOS Simulator** on your Mac → "iPhone 16 Pro Max" → install the TestFlight build → take screenshots there. Native 1290 × 2796.
2. **Resize your phone screenshots** to 1290 × 2796 with `sips`. Tell me when you have them and I'll do this in one command.

## What to capture (recommended sequence)

The order matters — App Store displays them in the order you upload, and the first 3 are what most users see in search results. Make those count.

For EWM Workforce, I'd capture these 6:

| # | Screen | Why this one |
|---|---|---|
| 1 | **Login screen** with the EWM logo | Brand signal, sets the tone. |
| 2 | **Today's shift** view (after sign-in, on the Site detail screen) showing "Josh Inn", scheduled time, and the Clock-In button | Tells the story — "see your shift, clock in, go." |
| 3 | **Task list** for an active shift — 5 tasks, room numbers, status pills | "Checklist + stopwatch" — the core daily flow. |
| 4 | **Task detail** with the **Start scan** prompt or scanner viewfinder open | Differentiator: scan-to-start. |
| 5 | **Photo proof** screen — task in progress with a photo attached | Differentiator: proof-of-work for hospitality. |
| 6 | **Clocked-out** confirmation / hours-today summary | Closes the loop. |

You'll want the **status bar to look clean**: on iOS, enable **Demo Mode** in TestFlight settings (or just take screenshots when the battery is full, signal full, time is sensible like 9:41 AM). Apple's own screenshots always show 9:41 — you don't have to, but it looks tidier.

## Step-by-step on your phone

1. **Make sure you're on build 0.1.0 (12)** — open TestFlight, confirm version.
2. **Sign in** as a pilot worker (`josh.motes@ewm-pilot.test` / `EwmTest2026!`).
3. **Take screenshot** at each of the screens above. iPhone screenshot = press **Side button + Volume Up** at the same time.
4. **Find them** in Photos → "Screenshots" album. AirDrop them to your Mac, or save to iCloud Photos and download from photos.icloud.com.
5. **Drop the files** anywhere on your Mac and tell me the folder. I'll resize/normalize and prepare them for upload.

If your phone isn't a Pro Max (i.e. screenshots aren't 1290 × 2796), I'll either upscale them with `sips` or you can run them through the Simulator route — your call when we get there.

## Step-by-step in the iOS Simulator (alternative)

If you'd rather skip your phone:

1. On this Mac, open **Xcode** → **Open Developer Tool** → **Simulator**.
2. **File → Open Simulator → iOS 18.x → iPhone 16 Pro Max** (the 6.7" device).
3. Install the IPA from the EAS build:
   - In Simulator menu bar: **Device → Add App…**
   - Pick the IPA: download from https://expo.dev/artifacts/eas/tkqjGZ1wLksisokRkkY6C4.ipa (build #12)
   - **Caveat**: IPAs built for App Store distribution are signed for real devices and won't run on Simulator. For Simulator screenshots, we'd need a separate build with `simulator: true` in eas.json. Roughly 10-15 min of work.
4. Or — install the development build that EAS dev profile produces, but that has the dev banner.

**Honest recommendation**: take screenshots on your phone. Pro Max users are 1290×2796 native; older Pro users (1179×2556 etc.) Apple will usually accept after asking. We can fix on the way in.

## After you have screenshots

Drop the PNGs anywhere on disk and tell me the path. I'll:
- Verify each one's dimensions
- Resize/upscale where needed to 1290 × 2796
- Strip alpha channels if any have transparency
- Order them in the recommended sequence
- Tell you the next clicks in App Store Connect (Media Manager → 6.7" iPhone → drop files)
