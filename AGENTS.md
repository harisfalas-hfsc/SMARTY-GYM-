<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Shared Workouts reuses the public community-workout view and guard — why: consistent listings without duplicated rules or Community changes.
- The workout creator's canonical route is `/create-your-own-workout`; `/create-your-workout` and `/coach` are redirects only — why: old bookmarks keep working.
- Build It Yourself uses createManualWorkout (src/lib/manual-workout.functions.ts), saving normal MY OWN WORKOUT rows without generation/doctrine — why: members choose exercises; Smarty rules govern coach/admin workouts only.

- Smarty Ritual rotation is computed from app_settings.ritual_anchor_date + position (src/lib/ritual-schedule.ts); no nightly job, so page and admin schedule never drift.
- Public PDFs are client-generated with every visible block — why: page parity.
- Smarty Check-ins scoring lives in src/lib/checkins/score.ts, computed server-side in checkins.functions.ts and read by coach via loadCheckinSignal — one source for UI, badges and coach.
- Coach/admin/WOD are deterministic; header Coach is read-only, account-keyed and decided only by coach/recommend.ts — why: one rule order, no cross-account state.
- Coach announcements share one photo-first, fixed-size scrolling frame across access levels; locked snapshots render the public introduction and reactivation action only — why: consistent presentation without locked personal briefing cards, with Premium details reachable below the photo.
- Smarty Workouts share admin controls and local media; collection and mobile-home featured reuse getFeaturedSmartyWorkouts and original dates through loaders — why: consistent published ordering, no desktop-home change or old-project dependency.
- Admin Smarty publication uses explicit selected/filtered IDs and the full gate, journals a stable action ID in existing operational history, and sends one combined Resend/inbox announcement for successfully transitioned rows; member archives stay read-only — why: predictable scope and retry-safe delivery without customer-asset changes or an email queue.
- Players accept verified numeric/slug IDs; bulk publishing needs a full-library audit. Native startup stays black through the first React frame.
- Admin publish failures are explained by the reporting-only publicationRuleReports layer after the existing compliance gate decides legality — why: precise section/exercise/dose/equipment guidance cannot alter workout doctrine.
- Member-only training data (workouts, set_logs, workout_feedback, workout_results) is gated by public.has_active_membership() in RLS plus requireActiveMembership (src/lib/membership.server.ts) in server functions — why: the server, not the screen, is the entitlement boundary; data is kept, only locked.
- First Premium activation sends one immediate email/inbox welcome, visible in Admin automation; renewals never repeat it.
- Visitors read community data only through definer views community_workouts_public / community_comments_public / community_badges_public (safe columns); raw workouts need has_active_membership, user_badges stays owner-only — why: no Premium content leaks, badges stay public.
- Public search uses shared route inventory; IndexNow sends changed public URLs only. Unverified research is noindex; workout search exposes card fields, never prescriptions — why: no Premium leaks.
- deleteManualWorkout is creator-only and covers the original plus all community copies: social data removed, rows with training activity tombstoned (deleted_at), others hard-deleted — why: training can't be undone.
- Route-module download failures share one classifier for update notice and root error screen; handled failures skip crash-alert reporting, unrelated errors still report — why: refresh fixes missing files without false emails.
- Confirmations/prompts use shared branded dialogs, never native boxes — why: consistent web/native look.
- Progress exports combine date-filtered workout, performance, award and check-in data in one PDF — why: members need one complete report.
- App panels reuse footer store links/icons and exclude announcement controls from outside dismissal — why: consistent links, independent closing.
- Mass emails use Resend dedupe; others use managed sending. All signatures share email-brand and EmailBrandFooter — why: reliable delivery, consistent branding.
- Insights shares one report across app, inbox and email; no Insights PDF — why: parity/privacy.
- Logbook mounts Insights above view content, outside ProgressSection — why: persistent entry across tabs.
- Workout sharing rechecks public originals and captures only WorkoutDisplay headers; blog sharing uses canonical article links and the same header capture — why: native pictures without private prescriptions.
- Interval/round steps log one set_logs row per interval (interval_index), count from statedIntervals in parse-steps.ts — why: training load sums every interval actually done, never one.
- Browser push mirrors paired inbox+email messages only via sendPushToUsers (src/lib/push-notify.server.ts), sent only to accounts that newly got the inbox row; tokens in push_subscriptions — why: one push per message, retries never duplicate.
