# Muscle-match check on every exercise, full audit of all 531 Smarty Workouts

## What went wrong in Gluteal Anchor (confirmed)

Gluteal Anchor (Strength, Core & Glutes, Intermediate, 45 min):
- **Bird Dog** is in both the Activation and the Finisher.
- **One Leg Floor Calf Raise** is in the Finisher. Your library lists it as *calves* (lower legs), not abs, core or glutes.

Why it got through:
1. **The Smarty Workouts check decides an exercise's muscle group from its name only.** Any name containing "calf" was treated as "lower-body push", and Core & Glutes allows lower-body push. So the check never looked at what your library says the exercise trains (target muscle and body part).
2. **New workouts are built using a different check, which does read the library.** So the two disagree. The Smarty Workouts check is the weaker one.
3. **No rule stops the same exercise appearing in two sections** (Activation vs Main vs Finisher). Today it only stops repeats inside one section.

## What I will build

### 1. One muscle-match rule for every workout source
Smarty Workouts, Smarty Coach, member "Create your own workout" and admin-built workouts will all use the same rule. Before an exercise is chosen, and again before a workout is published or shown, every exercise is checked against **your library's own muscle data** (target muscle, body part, extra muscles):

- **Core & Glutes:** only exercises whose main muscle is abs, obliques, spine/lower back, glutes, hamstrings when glute-dominant (hip thrust, bridge, RDL, swing), abductors or hip extensors. Calves, quads-only, chest, arms and shoulders are rejected.
- **Upper Body:** chest, back, lats, shoulders, arms, traps. At least one push and one pull.
- **Lower Body:** quads, glutes, hamstrings, calves, adductors/abductors. At least one push (squat/lunge) and one pull (hinge).
- **Low Push & Upper Pull / Low Pull & Upper Push:** push/pull decided per exercise from the library muscle + your hand-classified priority list. Each side must be covered. No exercise from the wrong push/pull side.
- **Full Body:** upper and lower both covered.
- **Muscle Building (hypertrophy):** the same focus rules, plus no conditioning, cardio or mobility moves in the Main Workout or Finisher.
- **Other categories** (Cardio, Calorie Burning, Metabolic, Challenge, Pilates, Mobility & Stability, Recovery): every exercise must still be on that category's closed list. Stretches and mobility stay only in Activation and Cool Down.
- Your hand classification of priority exercises still wins where it exists. The library's muscle data is the fallback, never the name.

### 2. No exercise repeated across sections
The same exercise, or its variant (e.g. "inchworm" / "inchworm v. 2"), can't appear twice anywhere in Activation, Main Workout and Finisher. The only exception is Cool Down stretches.

### 3. Full audit of all 531 Smarty Workouts
I will re-check every workout against **all** your rules, not a sample:
- Philosophy and structure: sections, order, Activation and Cool Down content.
- Your closed exercise lists: Strength/Muscle Building 100 + 17 band, Conditioning 60, Pilates 50.
- The new muscle-match and push/pull rules (above), for Main and Finisher.
- No repeats across sections.
- Format per category, and never the Main Workout's own format in the Finisher.
- Finisher minimums (12/15/20 min), stated time equal to real rounds × (work + rest), approved formats only.
- Strength finishers: Reps & Sets, 3–4 sets, 3 exercises, 60 sec rest.
- Equipment rules: bodyweight, free weights, machines, no new equipment in the Finisher.
- Timed moves written in seconds, never reps.
- Level rules, duration, and Cool Down matching the trained muscles.

### 4. Fixing what the audit finds
- A full backup of all Smarty Workouts first.
- Each wrong exercise is swapped for one from **your list** that trains the right muscle and uses the same equipment, level and dose type (timed for timed). It must also not repeat anything already in the workout.
- Re-check after every fix. Nothing is published while it fails.
- **Member workouts and Logbook copies are not touched.** That includes ones they started, finished or logged. Only Smarty Workouts (admin-owned) are fixed.
- Where no rule-safe swap exists, the workout is listed by name in the report rather than forced.

### 5. Report to you
A spreadsheet listing every workout, with every rule checked (pass/fail), what was wrong, and each exercise before and after. A plain summary in chat with counts per rule, every workout name that changed, and anything still open. That includes the open items from before: the 60-min member finisher with 2 exercises × 6 sets, and the 8 finisher/main repeats.

## Technical details
- `src/lib/workout/strength-focus.ts`: `focusGroups()` takes the library row (target_muscle, body_part, secondary_muscles), not only the name. Priority classification first, then library muscle, then the name regex only for rows with no muscle data. Add a muscle allowlist per focus. Add a push/pull map by target muscle (pectorals/delts/triceps = upper push; lats/upper back/biceps/traps = upper pull; quads/calves = lower push; hamstrings/glutes-hinge = lower pull).
- `smarty-compliance.ts`: pass rows into `focusBreaks`. Add a "cross-section repeat" hard issue using `movementKey()` across Activation/Main/Finisher. Add a hypertrophy "no conditioning/mobility in work sections" rule.
- `doctrine.ts focusViolation` and `pool.server.ts` reuse the same allowlist, so generator, validator and publish gate share one source. `validate.server.ts` gets the cross-section repeat check. `member-quality.ts` uses the shared classifier.
- Audit script: reads all smarty_workouts + full exercise library and runs `complianceIssues`. A repair pass uses existing swap helpers with a muscle-match predicate. Backup table `smarty_workouts_backup_muscle_match_20261014`. Writes `/mnt/documents/smarty-workouts-muscle-audit-2026-10-14.xlsx`.
- New tests: calf raise rejected for Core & Glutes, Bird Dog Activation+Finisher rejected, push/pull sides, hypertrophy exclusions. Then the full test suite, build check and a fresh 531-workout audit. Open Gluteal Anchor plus a sample of each focus in the admin preview on a phone-sized screen.
- Record the "one muscle-match classifier from library data" rule in AGENTS.md.
