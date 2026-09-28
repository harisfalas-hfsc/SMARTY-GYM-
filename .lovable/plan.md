# Smarty Check-ins — ported from the old SmartyGym project

## What the member gets (same as the old project)
- **Morning check-in, 07:00–10:00** (member's own time zone, default Cyprus): sleep hours, sleep quality (5 emoji faces), readiness 0–10, soreness 0–10, mood (5 emoji faces).
- **Evening check-in, 19:00–22:00**: steps, water (litres), protein level, day strain 0–10.
- Same forms, labels, emojis, sliders, pop-up that opens once per window, banner with "next check-in in Xh Ym", and the same **Daily Smarty Score 0–100** with red/orange/yellow/green colour and the same short feedback text after each check-in.
- Reminders at the start of each window through the existing in-app notifications (same wording as the old reminder emails).

## Where results show
- **Logbook → Progress**: a new **Check-ins** section next to Workouts and Training load — today's card, charts (score and each metric over time), history list, and the same Word/PDF export the old project had.
- Logbook calendar days get the check-in score colour dot, as in the old project.

## Coaching uses the check-ins
- Create Your Workout's **Today's recommendation** card (and the "Surprise me" / coach feedback) reads today's and yesterday's check-in, e.g. "Because you slept 5 hours and soreness is 8/10, a 1-star mobility session is suggested."
- The suggestion is only applied if the member taps to accept it — their own choice always stands, exactly as today.
- Workout of the Day is untouched (context note only, no change to the workout).

## Awards
- New **Check-ins** badge category in Progress → Achievements, placed **before Membership**: the old project's badges (7 / 30 / 90 consecutive complete days, hydration, movement, protein, recovery), shown in the same style as the existing badges and adding to the Progress Score.

## Not changed
Existing workouts, WOD, other badges, layouts, mobile/desktop pages outside the Progress section.

## Technical details
- New table `smarty_checkins` (one row per user per day, same fields and score columns as the old table), with GRANTs and owner-only RLS; score computed server-side by a ported `calculateScores` from the old `useCheckins.ts`.
- Server functions (`checkins.functions.ts`, requireSupabaseAuth) for save morning/evening, today, history range; window logic ported from `useCheckInWindow.ts` using `profiles.timezone`.
- Components ported from old `src/components/checkins/*` into `src/components/checkins/`, restyled only with this project's tokens; mounted in `ProgressSection.tsx` and a modal manager in the authenticated layout.
- `CoachContext` gains `checkinToday/Yesterday`; new rules in `coach-rules/index.ts` produce reasons and an optional `suggestedStars`/category; unit tests added.
- `badge_definitions` rows with category `checkins`; `CATEGORY_LABEL`/order updated so it renders before `subscription`; award evaluation extended in `progress.server.ts`.
- Reminder notifications added to the existing daily job (dedupe per window).
- Verify: vitest, build, Playwright signed-in run of both check-ins, Progress view and recommendation.
