# Weekly SEO update + daily health audit

## What already exists
- An "Automatic SEO update" job and a "Nightly system health check" job are already in the admin Cron Jobs section. Both are switched on, and both run every day at 00:00 Cyprus time.
- Both already email smartygym@outlook.com and have a "Run now" button.
- One checker runs every hour and starts whichever job is due.

## Changes

### 1. SEO update: weekly, Sunday night
- Change it from daily to weekly: Sunday night, finishing before Monday. Jobs can only start at 5 minutes past an hour, so it will start at 23:05 Cyprus time.
- Keep the same background-only method. It extends keywords and search/AI-crawler data, removes nothing, and changes nothing you can see on the site.
- Add the newer pages and features to what it covers: Smarty Ritual, Shared Workouts, Create Your Workout, the rankings page, Why Invest and The Smarty Method.
- Every run emails a numbered report: what was checked, what was updated, what was already fine, and anything that failed.
- Your on/off switch and the job details stay in Cron Jobs. The time can still be edited.

### 2. Health audit: daily at 12:00 Cyprus time
- Move it from 00:00 to 12:00 (it starts at 12:05 because of the hourly checker). Rename it to "Daily system health audit".
- Add these checks to the existing 15:
  - **Every scheduled job:** did each one run when it should have, did it fail, is it switched off or overdue?
  - **Workout generation:** failed or stuck requests in the last 24h, with the members affected.
  - **Workout of the Day:** today's workout exists for both setups.
  - **Payments:** the Payments switch state, failed or past-due subscriptions, and payment errors in the last 24h.
  - **Member failures:** any member-facing error in the last 24h, grouped by feature.
  - **Features:** Smarty Ritual (today's ritual resolves), Community, Shared Workouts, Exercise Library, Blog, Logbook, sign-in and email sending.
- The email lists every check as GOOD, WARNING or BAD with one line of detail each. The headline says what is wrong.

### 3. New "System Health" area in admin Settings
- A "Run full health check" button.
- While it runs, you see each check tick off live. Then the full report appears on screen.
- Every manual run also emails the same report to smartygym@outlook.com.
- A short history of past runs, each with its report, so you can open earlier results.
- The same audit keeps running daily from Cron Jobs, where you can switch it on or off.

## Technical details
- `registry.ts`: seo-refresh becomes `timing: "weekly"`, `weekday: 0`, 23:00. Update the cron_jobs row with a data update: hour 23 for seo-refresh, hour 12 for health-check.
- `health-check.server.ts` / `health-checks.ts`: add checks for cron_runs freshness per job, workout_generation_requests/failures, subscriptions status and payment error_events, today's WOD rows, the ritual schedule, and community/shared read access.
- The runner writes results for each check into cron_runs.details. A server function (admin-only via has_role) starts the audit. The UI polls the run row to show progress.
- A new Settings panel component. The health-report email template gets the extra sections.
- Tests for the weekly-due logic and the new checks, then a build check. One end-to-end manual run, confirmed by the email log.
