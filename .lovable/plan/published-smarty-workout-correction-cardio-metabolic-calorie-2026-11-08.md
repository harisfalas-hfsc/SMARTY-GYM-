# Published Smarty Workout correction: Cardio, Metabolic, Calorie Burning, Challenge

## Sources (as they exist in this project)
- Published workouts: live `smarty_workouts` table (582 visible: Cardio 61, Metabolic 64, Calorie Burning 64, Challenge 88). The export is used only as a reference; every change is checked against the live record first.
- Exercise library: the `exercises` table (the file `public/data/exerciseData_complete.json` from the old project does not exist here).
- Priority lists and doctrine: `src/lib/workout/priority.ts`, `conditioning-vocabulary.ts`, `prep-vocabulary.ts`, `mobility-recovery-vocabulary.ts`, `rules.ts` (the old `supabase/functions/_shared/...` files do not exist here).

## Step 1 — Read-only audit (nothing changed yet)
- Cardio 19, Metabolic 18, Challenge 26, Calorie Burning 20: find each listed Inchworm in Main Workout/Finisher on the live record.
- Calorie Burning, all 64: check Main Workout and Finisher for the 11 named movements, single-muscle exercises (curls, triceps extensions, lateral/front raises, shrugs, calf raises) and setup-heavy stations (bench, bar, fixed station).
- Metabolic Surge: review both kettlebell hang cleans; keep them if suitable, keep kettlebell moves grouped.
- For each, pick a replacement: Mountain Climber first, then Bear Crawl, High Knees, Burpee, Jump Squat (or your listed alternatives), only if it exists in the library, matches equipment/difficulty, is not already in that workout, and adds no new equipment to a Finisher.
- Output a correction list (workout, section, old exercise, new exercise, reason) plus a list of flagged-but-kept exercises with reasons.

## Step 2 — No separate review
Per your instruction, your suggestions are the approved plan; corrections are applied directly.

## Step 3 — Apply the confirmed corrections
- Back up affected rows to a dated backup table first.
- Change only the exercise name (and its linked picture) in that one line; dose, rest, rounds, order, timing, title, category, level, duration and format stay identical.
- Strength, Muscle Building, Pilates, Mobility & Stability, Recovery are never touched. Members' saved workouts, Logbook and history are never touched.

## Step 4 — Validate and report
- Re-run doctrine checks on every changed workout; compare before/after to prove only the named lines changed and protected categories are byte-identical.
- Final report: counts per category, every correction, kept items with reasons, anything not fixable, validation results.

## Step 5 — Future workouts learn from this
- Add Inchworm (and similar prep/mobility moves) to the banned list for conditioning work sections.
- For Calorie Burning: block single-muscle exercises and the hard-to-repeat/complex movements confirmed as violations in Step 1.
- Add tests so new coach/admin generation cannot repeat these mistakes, and save your rules to project memory.
