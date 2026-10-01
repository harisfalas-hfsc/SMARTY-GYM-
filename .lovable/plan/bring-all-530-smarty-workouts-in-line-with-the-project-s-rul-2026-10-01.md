# Bring all 530 Smarty Workouts in line with the project's rules

## Audit result (read-only, already run, no changes made)
I checked all 530 workouts against the same rules the engine uses for new workouts. 427 break at least one rule and 103 are already fine.

| Issue | Workouts | Categories |
|---|---|---|
| Too few of your priority exercises | 426 | Strength, Cardio, Calorie Burning, Challenge, Metabolic, Recovery |
| Balance tool or isolation machine in a flowing or timed format | 68 | Cardio, Challenge, Metabolic |
| Challenge is not full-body or not mostly bodyweight | 26 | Challenge |
| Cardio has turned into a metabolic session | 3 | Cardio |
| Too many kinds of equipment in one session | 2 | Strength, Mobility & Stability |
| Finisher in a category that never has one | 1 | Mobility & Stability |
| Exercise that doesn't belong to the category | 1 | Mobility & Stability |

No workout has a format its category doesn't allow, an unrealistic exercise (gymnastics, levers, Olympic lifts), or a setup-heavy exercise under a clock.

## What I will fix, why, and how
For each fix I swap exercises only. The workout's name, picture, category, format, duration, level, sections, sets, reps, times and text stay the same. No AI is used, so no credits are spent.

1. **Priority exercises (426).** Why: your rule says sessions should be built mainly from your priority lists. How: swap non-priority exercises in the Main Workout and Finisher for a priority exercise with the same movement pattern and body area, using the same equipment the workout already uses. Bodyweight workouts get bodyweight priorities. The original dose stays.
2. **Balance tools and isolation machines in flowing or timed formats (68).** Why: these break the flow under a clock. How: replace each one with a priority exercise of the same pattern that is free-standing.
3. **Challenge balance (26).** Why: a Challenge must be a full-body benchmark that is mostly bodyweight. How: swap equipment-based or one-area exercises for bodyweight priority exercises until the session covers upper body, lower body and core, with most exercises bodyweight.
4. **Cardio turned metabolic (3).** Why: Cardio must stay aerobic. How: replace the heavy or strength-dominant moves with aerobic priority exercises.
5. **Too many kinds of equipment (2).** Why: members shouldn't have to set up a gym mid-session. How: swap the odd-one-out exercises to match the session's main equipment.
6. **Finisher in Mobility & Stability (1).** How: remove the Finisher block.
7. **Exercise that doesn't belong to the category (1).** How: swap it for a matching mobility exercise.

Swaps only use exercises from your library that have a demonstration picture. If a workout has no legal swap, I leave it unchanged and list it in the report. I never invent an exercise.

## Safety and verification
- Before writing anything, I save a backup of every workout's current content, so any workout can be restored.
- I re-run the full audit after the fixes. The target is zero rule breaks, apart from any workouts I list as having no legal swap.
- The existing transfer check must still pass: all sections present, every exercise linked and playable, covers intact.
- I open sample workouts from every category in the player in the browser, and run the tests and build.
- Visibility (Show/Hide) and the Workout of the Day schedule stay as they are.

## Technical details
- One deterministic script reuses `doctrine.ts` validators, `priority.ts` (`pickPriorityByPattern`, `resolvePriority`) and `parse-steps.ts`. It rewrites only `{{exercise:ID:Name}}` tokens in `smarty_workouts.main_workout` and saves through data updates.
- The backup goes to `audits/smarty-workouts-pre-compliance-2026-10-01.json` and the final report to `audits/smarty-workouts-compliance-2026-10-01.json`.
- A regression test runs the compliance audit, so future edits can't reintroduce rule breaks.
