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

- Shared Workouts uses the existing public community-workout view and access guard — why: consistent listings without duplicated rules or Community changes.
- The workout creator's canonical route is `/create-your-own-workout`; `/create-your-workout` and `/coach` are redirects only — why: old bookmarks keep working.
- Build It Yourself uses createManualWorkout (src/lib/manual-workout.functions.ts), saving normal MY OWN WORKOUT rows without generation/doctrine — why: members choose exercises; Smarty rules govern coach/admin workouts only.

- Smarty Ritual rotation is computed from app_settings.ritual_anchor_date + position (src/lib/ritual-schedule.ts); no nightly job, so page and admin schedule never drift.
- Public PDFs are client-generated and include every visible block — why: exact page parity.
- CHALLENGE uses challengeBalanceViolation for full-body, majority-bodyweight, on-level benchmarks; filterPool prefers smarty_tags — why: consistent challenge structure.
- Difficulty is prescription-only; beginners exclude advanced rows. flowSpecialtyViolation bans balance tools/isolation machines in flow/timed formats in pool and validator — why: one WOD/custom engine.
- Smarty Check-ins scoring lives in src/lib/checkins/score.ts, computed server-side in checkins.functions.ts and read by coach via loadCheckinSignal — one source for UI, badges and coach.
- Coach/admin/WOD generation is deterministic (no AI) via shared generateWorkoutContent; priority lists live only in priority.ts — why: one rule package.
- Smarty Workouts share admin controls and local media; featured uses shared cards and locally preserved original dates — why: one collection, accurate newest order, no old-project dependency.
- Players accept verified numeric/slug IDs; bulk publishing needs a full-library audit. Native startup stays black through the first React frame.
- Closed exercise lists, all read by rules.ts: Activation/Cool Down named lists (prep-vocabulary.ts), Pilates, Mobility & Stability, Recovery (*-vocabulary.ts) — why: generator, pool, publish gate and audit share one rule.
- All workout rules (exercise legality per section, workout structure, dose, duration) are decided only in src/lib/workout/rules.ts (built on doctrine.ts + prep-vocabulary.ts); the pool filter, validator and smarty-compliance audit all call it — why: one rule layer, so no check can apply half the rules.
- Stored-workout repairs go through planMigration in src/lib/workout/smarty-compliance.ts; bannedSwap blocks unsafe substitutes — why: one repair path on the one rule engine, reversible via the pre-migration backup table.
- Admin publish failures are explained by the reporting-only publicationRuleReports layer after the existing compliance gate decides legality — why: precise section/exercise/dose/equipment guidance cannot alter workout doctrine.
- Member-only training data (workouts, set_logs, workout_feedback, workout_results) is gated by public.has_active_membership() in RLS plus requireActiveMembership (src/lib/membership.server.ts) in server functions — why: the server, not the screen, is the entitlement boundary; data is kept, only locked.
- First Premium activation sends one immediate email/inbox welcome, visible in Admin automation; renewals never repeat it.
- Visitors read community data only through definer views community_workouts_public / community_comments_public / community_badges_public (safe columns); raw workouts need has_active_membership, user_badges stays owner-only — why: no Premium content leaks, badges stay public.
- Public search uses shared route inventory; IndexNow sends changed public URLs only. Unverified research is noindex; workout search exposes card fields, never prescriptions — why: no Premium leaks.
- deleteManualWorkout is creator-only and covers the original plus all community copies: social data removed, rows with training activity tombstoned (deleted_at), others hard-deleted — why: training can't be undone.
- Route-module download failures share one classifier for update notice and root error screen; handled failures skip crash-alert reporting, unrelated errors still report — why: refresh fixes missing files without false emails.
- Confirmations/prompts use shared branded dialogs, never native boxes — why: consistent web/native look.
- Public Training Load copy mirrors `src/lib/performance` — why: its science must match the actual formula.
- Progress exports combine date-filtered workout, performance, award and check-in data in one PDF — why: members need one complete report.
- App panels reuse footer store links/icons and exclude announcement controls from outside dismissal — why: consistent links, independent closing.
- Mass emails (announcements, weekly Insights) use the Resend gateway with broadcast_email_sends dedupe; other email uses Lovable managed sending — why: bulk needs the marketing-grade path.
- Announcements and Insights each share one content source across inbox, email (and PDF); email opt-outs never block inbox — why: matching content, independent channels.
