# Pre-release audit: verification and fix plan

## Verification results (checked against the code and the live database)

| # | Finding | Verdict |
|---|---|---|
| RED 1 | Expired members can still read their saved workouts/data directly | **Confirmed.** Ownership-only read rules; the lock is only on screen. |
| RED 2 | Expired members can still change workout status, feedback, performance | **Confirmed.** e.g. setWorkoutStatus checks owner only. |
| RED 3 | Anyone can upload/delete exercise-library media | **Not true today.** That old rule was removed by a later change. Live: only admins can upload/change/delete; the public can only view animations. No fix needed. |
| RED 4 | First person to sign up becomes admin | **Not true today.** It exists in an old file, but the live sign-up logic no longer does this. Admin comes only from the roles table. Small cleanup only. |
| RED 5 | Account deleted even if Stripe cancel fails | **Confirmed.** Error is logged, deletion continues. |
| RED 6 | Older Stripe events can overwrite newer ones; no event deduplication | **Confirmed.** "last_event_at" stores the subscription creation time, not the event time, and nothing is compared. |
| RED 7 | Deleting a comment skips the membership check | **Confirmed**, low impact (own comments only). |
| W1 | Cron minute ignored | **Confirmed.** Only the hour is compared. |
| W2 | Scheduler not provable from code | **Partly.** It's set up in the database, not in code. I'll confirm the live hourly job and its recent runs. |
| W3 | 2,000-member cap | **Confirmed** (one reminder query). |
| W4 | Share card shows details for any workout ID | **Confirmed.** No "is shared/public" check. |
| W5 | Locked page opens if the check fails | **Confirmed**, by design for offline use. |
| W6 | No CI / test command | **Confirmed.** No test script; no GitHub workflow. |
| W7 | Admin errors don't always name the exercise | **Already fixed** in the last round (rule, section, exercise, dose, equipment). |

## Fix plan

1. **One server membership check (RED 1, 2, 7).** Add one shared "requires active membership" step on the server, built on the existing access check (admins and free-access mode still count as members). Apply it to every member-only action: opening a saved workout, status, scheduling, feedback, performance, progress, comment deletion. Saved workout pages load through this check, not straight from the database. Data is still kept, never deleted. Sign-in, account, billing and deleting your account stay open to expired members.
2. **Database rule (RED 1).** Reading full saved workouts also needs an active membership in the database itself, so the direct route is closed too. Expired members can still see the list headings so the "renew" screen works.
3. **Account deletion (RED 5).** If any live subscription can't be cancelled, stop the deletion and show "We couldn't cancel your membership payment — please try again or contact us." Nothing gets deleted.
4. **Stripe events (RED 6).** Save every Stripe event ID; skip any event already handled. Store the real event time, and ignore events older than the one already saved.
5. **Old admin file (RED 4).** Neutralise the old "first user becomes admin" code in the setup files so it can never come back. Live behaviour stays as it is.
6. **Cron minute (W1).** The hourly run starts jobs in the configured hour, once the configured minute has passed. If the hourly trigger only runs once an hour, the admin screen says "runs within the hour".
7. **Scheduler proof (W2).** Check the live hourly job and its last runs; add a health check that warns if no run happened in the last 2 hours.
8. **Remove the 2,000 cap (W3).** Process members in pages of 1,000 until all are done.
9. **Share card (W4).** Only return details for shared, Workout of the Day or Smarty workouts, or for the owner.
10. **Locked page when offline (W5).** Keep offline use for data already on the device. When online and the check fails, show the locked screen with "Try again".
11. **Release check (W6).** Add a test command and a GitHub workflow that runs tests, type check and build on every push.
12. **W7, RED 3:** no change, already fine.

Then: run all tests, type check and build, and test with an expired account and an active account.

## Technical details
- New `requireActiveMembership` middleware in `src/lib/` wrapping `getAccessStateForUser`; added to coach/performance/feedback/progress/schedule/workout-read server fns and `deleteComment`.
- Migration: membership-aware SELECT for full workout content via a `has_active_membership(uid)` security-definer function (subscription active, admin role, or free-access setting); `stripe_events(id pk, type, created)` table with service_role grants; `last_event_at` set from `event.created` with a `WHERE last_event_at < new` guard.
- `deleteMyAccount` returns `{ error }` on any cancel failure before `auth.admin.deleteUser`.
- `isDueNow`: `localHour == hour && localMinute >= minute`.
- `billing-notify.server.ts`: `.range()` pagination.
- Rewrite old migration bootstrap via a new migration redefining `handle_new_user` (already clean live) plus a comment; earlier files are not edited.
- `.github/workflows/ci.yml` + `"test": "vitest run"`.
