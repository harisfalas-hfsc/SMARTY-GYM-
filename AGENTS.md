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

- Keep the standalone Shared Workouts page backed by the existing public community-workout view and access guard, so its listing stays consistent without duplicating workout rules or altering Community.
- The workout creator's canonical route is `/create-your-own-workout`; `/create-your-workout` and `/coach` are redirects only — why: old bookmarks keep working.
- Member-built (Build It Yourself) workouts are saved by createManualWorkout (src/lib/manual-workout.functions.ts) as normal workouts with category MY OWN WORKOUT, bypassing the generation engine and its doctrine — why: the member chooses their own exercises; Smarty rules apply only to coach/admin workouts.

- Smarty Ritual rotation is computed from app_settings.ritual_anchor_date + position (src/lib/ritual-schedule.ts); no nightly job, so page and admin schedule never drift.
- Ritual exports are generated client-side as real DOCX and paginated PDF files with embedded emoji artwork; this preserves formatting and avoids mislabeled HTML or print-window downloads.
- Workout engine: CHALLENGE sessions are enforced as full-body, majority-bodyweight, on-level benchmarks via challengeBalanceViolation (doctrine.ts) as a structural validator error; exercise library carries smarty_tags (9 tags, backfilled from category/body_part/difficulty/equipment) used to prefer challenge vocabulary in filterPool.
- Workout difficulty is prescription only: filterPool never narrows vocabulary by level (beginner just drops library-"advanced" rows); flowSpecialtyViolation (doctrine.ts) bans balance tools/isolation machines in flow categories and timed formats, enforced in both pool and validator — one engine for WOD and custom.
- Smarty Check-ins: scoring/windows live in src/lib/checkins/score.ts (pure, ported from old SmartyGym) and are computed server-side in checkins.functions.ts; coach rules read them via loadCheckinSignal — one source so UI, badges and recommendations agree.
- Workout delivery is fail-fast: WOD uses the deterministic library engine immediately; manual generation gets one 18-second AI attempt, then the same library-only fallback.
- All workout generation (admin Smarty Workouts, member Create Your Workout, daily WOD) goes through generateWorkoutContent in src/lib/workout/generate.server.ts; coach priority lists live only in src/lib/workout/priority.ts — why: one rule package, so every rule change applies to all three.
- All Smarty Workouts are one collection with identical admin controls regardless of origin; imported workouts and media are self-contained in this project — why: no ongoing dependency on another project.
- Players accept verified numeric/slug exercise IDs; bulk publishing requires the full-library audit. Native startup stays black through launch, window, WebView, and first React frame to prevent white handoffs.
- Activation and Cool Down are bodyweight-only mobility/stability/stretch vocabulary (no equipment, no push-ups/lunges/squats/kicks), enforced in prep-vocabulary.ts + rules.ts prep branch — why: one prep rule for generator, pool and audit.
- All workout rules (exercise legality per section, workout structure, dose, duration) are decided only in src/lib/workout/rules.ts (built on doctrine.ts + prep-vocabulary.ts); the pool filter, validator and smarty-compliance audit all call it — why: one rule layer, so no check can apply half the rules.
- Stored-workout repairs go through planMigration in src/lib/workout/smarty-compliance.ts (resolve mode applies coaching decisions; bannedSwap blocks Crab Walk→Bear Crawl, new pistol squats and advanced substitutes) — why: one repair path on the one rule engine, reversible via the pre-migration backup table.
- Admin publish failures are explained by the reporting-only publicationRuleReports layer after the existing compliance gate decides legality — why: precise section/exercise/dose/equipment guidance cannot alter workout doctrine.
- Member-only training data (workouts, set_logs, workout_feedback, workout_results) is gated by public.has_active_membership() in RLS plus requireActiveMembership (src/lib/membership.server.ts) in server functions — why: the server, not the screen, is the entitlement boundary; data is kept, only locked.
- Stripe webhook applies each event once (public.stripe_events) and ignores events older than subscriptions.last_event_at — why: duplicate or out-of-order deliveries can't overwrite newer membership state.
- Visitors read shared community workouts only through the definer views community_workouts_public / community_comments_public (safe columns); raw workouts rows need has_active_membership — why: full workout content never reaches non-members.
- Public search uses the shared route inventory and factual entity data; IndexNow sends changed public URLs only, and unverified research stays noindex. Visible Smarty Workout search data uses only public card fields and cover URLs, never exercise prescriptions — why: discovery must not leak Premium data or unsupported claims.
