# Smarty Coach — one clear, rule-based "brain" (zero AI credits)

## How your philosophy compares with what exists today

| Your requirement | Today | After this plan |
|---|---|---|
| No AI, same input = same answer | Yes, already | Kept, and proven by tests |
| Check-ins (sleep, mood, energy…) | Reads only today + yesterday | Reads today plus the last 3 days, with fixed rules |
| Missing check-in = unknown | Mostly | Guaranteed: never treated as "ready" |
| Training Load + readiness | Uses the existing formulas | Same formulas, unchanged |
| Effort after a workout (RPE), stars chosen | Partly used | Used when logged; ignored (not zero) when skipped |
| Upper/lower/full-body rotation | Not done | Added, using real body-focus labels only |
| 3 hard days in a row → recovery | Not done | Added |
| Calendar planned session | Shown, not checked for safety | Kept only if safe, otherwise recovery wins |
| Pick from Smarty Workouts | Simple category match | Strict filters, then fixed ranking order |
| Build-your-own fallback | Generic "Create a workout" link | Ready exercise list from the Exercise Library, only when no Smarty Workout fits |
| Why it was chosen | Short reasons | Reasons built only from the rules that actually fired |

Note: your check-in does not ask about "stress" or "energy" by those names. It asks sleep hours, sleep quality, readiness, soreness, mood, and in the evening how hard the day felt. The Coach will use exactly those.

## The decision order (the Coach always follows these steps in this order)

```text
1. SAFETY & RECOVERY  ->  can stop here with "Recovery" or "Rest"
2. HOW TIRED / HOW MUCH TRAINING RECENTLY
3. WHAT KIND OF SESSION IS NEXT (rotation)
4. CALENDAR (planned session, if still safe)
5. CHOOSE A SMARTY WORKOUT (filters, then ranking)
6. BUILD-YOUR-OWN SUGGESTION (only if step 5 finds nothing)
```

A lower step can never undo a higher one. A streak, goal or planned session never overrides recovery.

### Step 1 — Safety and recovery
- Readiness "Recovery Recommended" or Training Load "Very High" → Recovery / Mobility & Stability, or rest.
- Training Load "High" or readiness "Caution" → no hard session; light or moderate only.
- Three hard training days in a row → recovery preferred.
- Check-in rules (existing thresholds kept): two or more poor signals (sleep under 5.5 h, poor sleep quality, soreness 7+/10, readiness 3/10 or less, yesterday felt 8+/10) → light only. One poor signal → moderate at most. A very good check-in never cancels a high workload.
- Check-ins from the previous 3 days: if two or more of them were poor, intensity is capped at moderate.
- The PAR-Q / health answers keep working exactly as today. The Coach never diagnoses.

### Step 2 — Recent training
Uses completed workouts from the last 7 and 14 days, days in a row, logged effort, and the existing Training Load. If Training Load says "Limited Data", the Coach uses only the other signals and says so — it never invents a score.

### Step 3 — Next kind of session (preferences, not orders)
- Lower body yesterday → upper body. Upper body → lower body.
- Full body → easy cardio, mobility or recovery (no second full-body strength day).
- Cardio / conditioning → strength if recovered; after a hard conditioning day, something easier.
- Mobility & Stability or Recovery → back to normal training if readiness allows.
- No history at all → an introductory 1-star session, with no claims about ability.

"Hard" is decided by the workout's stars (and logged effort when given), never by its category name alone.

### Step 4 — Calendar
A planned session is recommended if it fits steps 1–3. If it conflicts with recovery, the Coach says so and recommends the lighter option instead. Already-completed sessions are never suggested again.

### Step 5 — Choosing a Smarty Workout
First remove anything unsafe, wrong difficulty for the member's level, needing equipment they don't have, or the same body focus as yesterday. Then rank by: safety fit → purpose → body focus → goal/equipment/duration → not done recently → progression → fixed tie-breaker. Same data, same workout, every time.

### Step 6 — Build-your-own suggestion
Only when no Smarty Workout fits. The Coach shows a short ready list of real Exercise Library exercises (from your approved lists), with sets/reps or time, rest and effort guidance, and a button to Create Your Own Workout. It never says a workout was saved. If even that is not possible, it recommends rest.

## What the member sees
The same Coach window, now showing: the recommendation, the chosen workout (or build-your-own list or rest), and "Why" lines built only from real data. It never says "you are recovered", "stronger" or "fatigued" unless the data shows it. When data is thin, it says "Based on limited data".

## Technical details
- New pure engine `src/lib/coach/recommend.ts` split into: normalize inputs, recovery gate, recent-training analysis, purpose selection, library filter/rank, custom fallback, explanation + reason codes. Output: action type, workout id, category, intensity, reason codes, explanation, fallback flag, data confidence, destination.
- Reused unchanged: `performance/readiness.ts`, `performance/load.ts`, `coach-rules` check-in thresholds, `loadCheckinSignal` (extended to read the previous 3 days), `workout/rules.ts` closed exercise lists, membership guard.
- Body focus comes only from `smarty_workouts.focus`. Verified data: Strength has Full Body, Upper Body, Lower Body, Core & Glutes and two push/pull splits; 4 Strength workouts and every non-Strength category have no focus → treated conservatively by category, never guessed from names. No dedicated "intensity" field exists, so intensity = difficulty stars plus logged RPE.
- Member-created workouts have no reliable body focus; only Smarty-Workout copies (tag `smarty:<id>`) inherit it.
- `getCoachSnapshot` calls the new engine; `decideCoachSnapshot` keeps the window layout. Fallback opens `/create-your-own-workout` with the suggested list shown in the Coach (no new prefill system).
- 22 required tests plus conflict cases in `src/lib/coach/__tests__/recommend.test.ts`; existing tests, build, and desktop/phone checks of the window.
- Record the rule in AGENTS.md: Coach decisions come only from `src/lib/coach/recommend.ts`.

## Not included
No AI, no chat, no automatic workout creation, no changes to Training Load, readiness, check-in scoring or workout completion, no new check-in questions.
