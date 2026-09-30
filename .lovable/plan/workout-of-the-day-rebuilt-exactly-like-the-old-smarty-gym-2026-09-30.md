# Workout of the Day — rebuilt exactly like the old Smarty Gym

## What changes for you and your members

1. **Recovery comes back as its own category** in Smarty Workouts (9 categories). All recovery workouts from the old project are brought over the same way as the other 515: picture, full content, player-ready exercises, tags, self-contained in this project. They pass the same quality check before they can go live. The old "never re-add Recovery" rule is replaced by your new instruction.
2. **One Workout of the Day for everyone** (no more personal WODs). Every night at 00:00 Cyprus time the system reads the old 84-day plan, unchanged, and picks from your Smarty Workouts:
   - one **Bodyweight** and one **Equipment** workout matching that day's category, level and strength focus;
   - on Recovery days, one Recovery workout (exactly as the old project).
   - Rotation like the old project: a workout is not repeated until every other matching workout has been used; new workouts you add join the pool immediately.
3. **Workout of the Day page** shows the two cards (same card style as the old project/logbook). Everyone can see them; opening one requires Premium (visitors and free members get the join-Premium message).
4. **"Subscribe to Workout of the Day" is removed** everywhere (page, profile settings, admin stats, the old personal auto-delivery job). Premium members simply get it.
5. **Admin → Workout of the Day** rebuilt like the old admin panel:
   - Today's and tomorrow's workouts with View / Edit.
   - Schedule preview of upcoming days (day in cycle, category, level, focus, chosen workouts).
   - Override any date: pick a different workout for either slot; Swap / Re-pick / Approve for tomorrow.
   - "Periodization system" view of the full 84-day plan.
   - Coverage check: warns when a day has 0 or few matching workouts.
   - Past WOD history.
6. **Cron jobs tab:** new "Workout of the Day selection" job at 00:00 Cyprus, with run history, Run now, and a morning safety check that fills any missing slot. The old personal "WOD auto-delivery" job is removed.
7. About / How It Works / FAQ / live counts updated for Recovery and the new shared Workout of the Day.

## Content check on Smarty Workouts

Every day of the 84-day plan will be checked against your library (category + level + bodyweight/equipment + strength focus). Current library levels are 1–3 stars; the old plan uses Beginner/Intermediate/Advanced, so they map 1:1. Any day with no matching workout is listed in the admin coverage check and reported to you — nothing is invented to fill it.

## Technical details

- Import: re-run the existing legacy import for category RECOVERY (rec-*, WOD-REC-*), same linking/audit, covers + WebP variants; add RECOVERY to categories, engine, filters, category page and counts.
- `src/lib/wod-cycle.ts` keeps the 84-day table verbatim (anchor 2025-11-25, Europe/Athens).
- New tables: `wod_schedule` (date, slot BODYWEIGHT/EQUIPMENT/RECOVERY, smarty_workout_id, source auto/override, status) and `wod_selection_ledger` (ever-used rotation); public read of today's cards, admin-only writes; GRANTs + RLS.
- Selector in a `.server.ts` shared by cron route, admin Re-pick and safety check; slot-aware (fills only missing slots); bodyweight = location "anywhere", equipment = "gym".
- Access for opening goes through existing server-side Premium check; `profiles.wod_mode/wod_subscribed_at/...` marked deprecated, no longer read.
- Verification: unit tests for cycle/day mapping and rotation, full-cycle coverage audit, Playwright check of the WOD page (visitor, premium) and admin tab, typecheck, tests and build.
