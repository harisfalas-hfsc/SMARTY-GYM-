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
- The workout creator's canonical route is `/create-your-workout`; `/coach` exists only as a redirect so old bookmarks still work.

- Smarty Ritual rotation is computed from app_settings.ritual_anchor_date + position (src/lib/ritual-schedule.ts); no nightly job, so page and admin schedule never drift.
- Ritual exports are generated client-side as real DOCX and paginated PDF files with embedded emoji artwork; this preserves formatting and avoids mislabeled HTML or print-window downloads.
- Workout engine: CHALLENGE sessions are enforced as full-body, majority-bodyweight, on-level benchmarks via challengeBalanceViolation (doctrine.ts) as a structural validator error; exercise library carries smarty_tags (9 tags, backfilled from category/body_part/difficulty/equipment) used to prefer challenge vocabulary in filterPool.
- Workout difficulty is prescription only: filterPool never narrows vocabulary by level (beginner just drops library-"advanced" rows); flowSpecialtyViolation (doctrine.ts) bans balance tools/isolation machines in flow categories and timed formats, enforced in both pool and validator — one engine for WOD and custom.
- Smarty Check-ins: scoring/windows live in src/lib/checkins/score.ts (pure, ported from old SmartyGym) and are computed server-side in checkins.functions.ts; coach rules read them via loadCheckinSignal — one source so UI, badges and recommendations agree.
- Workout delivery is fail-fast: WOD uses the deterministic library engine immediately; manual generation gets one 18-second AI attempt, then the same library-only fallback.
- All workout generation (admin Smarty Workouts, member Create Your Workout, daily WOD) goes through generateWorkoutContent in src/lib/workout/generate.server.ts; coach priority lists live only in src/lib/workout/priority.ts — why: one rule package, so every rule change applies to all three.
