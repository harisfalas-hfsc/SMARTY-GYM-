# Cron Jobs page: full audit and fixes

## What I found

**1. Are all jobs listed?** Almost. There's one hourly scheduler that runs every job on the page: daily motivation, WOD selection, workout reminders, check-in reminders, SEO update, health audit, weekly blog article, problem alerts, and the Premium welcome. Two automatic tasks exist in the website but aren't on the page, and nothing ever starts them:
- **Retry failed workout creations**: retries a workout creation that failed halfway.
- **Recover abandoned creations**: cleans up workout creations a member started but never finished.

**2. Latest Problems card.** It shows recent problems and has a "Mark handled" button for each one. It has no refresh button, no "mark all handled", and no way to clear old problems. Problems you've already handled stay in the list.

**3. Latest activity.** Each job shows its last 10 runs.

**4. Hours and minutes (a real bug).** The scheduler only wakes up once an hour, at :05. So a time like 10:30 actually runs at 11:05. A time after :05 in the last hour of the day (for example 23:30) never runs at all.

**5. Workout and check-in reminders.** Check-in reminders run and record normally. Workout reminders only write a history line when a reminder is actually sent, and none have been sent yet. So the card looks empty even though the job is running.

**6. SEO update, 4 October failure.** All SEO checks passed. The only problem: the indexing service (IndexNow) said "busy, try later" (429) for 2 addresses. That was already changed so "busy" keeps the addresses queued and is not a failure. This run happened before that change.

**7. Health audit, 5 October failure.** The audit reported a failure because yesterday's SEO run had failed (point 6). It also flagged 3 page-loading errors (already fixed) and 56 exercises without a demo picture, which was only a warning. Nothing new is broken.

## What I will fix
1. **Add the two missing jobs** to the Cron Jobs page with on/off switches, and have the hourly scheduler run them so they actually work.
2. **Make chosen times exact.** The scheduler will wake every 5 minutes instead of once an hour. Each job still runs only once per day (or week) at the time you set, member messages are never sent twice, and the 23:30 bug goes away.
3. **Latest Problems card:** add "Refresh", "Mark all handled", and "Clear handled problems" buttons. Clearing asks first, in the branded dialog.
4. **Workout reminders:** record one history line per day ("0 reminders due" or "N sent"), so you can see the job is alive.
5. **Recent activity:** keep 10 runs per job, with a "Show more" button for up to 30.
6. **Health audit:** a job that failed earlier and has worked since will no longer count as a failure in the next audit.
7. Run each job once by hand afterwards and confirm a successful history line for each.

## Technical details
- Registry gains `retry-generations` and `recover-abandoned`. `daily-run` calls their existing handler logic and uses `recordRun`.
- Change the pg_cron schedule from `5 * * * *` to `*/5 * * * *`. `isDueNow` is already date-deduplicated through `last_run_on`; motivation and check-in loops get the same per-member/day dedupe check before sending.
- Problems: server functions to bulk-resolve and delete resolved `error_events` (admin-checked).
- Health "jobs" check counts only a job's latest run, not any failure in the last 24 hours.
- Verification: tests, typecheck, build, a manual trigger of the runner, and a read of `cron_runs`.
