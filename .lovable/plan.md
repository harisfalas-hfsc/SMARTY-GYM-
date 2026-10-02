# Finish every Smarty Workout and close the gaps in the rules

Goal: all 530 workouts pass every rule (530 of 530, none left unchanged), and the rules catch the problems found last time. AI credits can be used where the swap-only fix gets stuck.

## 1. Close the gaps in the rules first

The new rules go into the single rule engine. Generated workouts (WOD, Create Your Workout, admin) and the stored library then follow them automatically.

- **Recovery:** no loaded or strength work. That means no dumbbells, curls, presses, rows with weights, step-ups with load or lunges with load. Only gentle mobility, stretching, breathing and light bodyweight movement.
- **Cardio main work:** most of it must be aerobic. That means running, skipping, jacks, high knees, butt kicks, step-ups, shuffles, bike, rower and similar. Push-ups, goblet squats, bear crawls, crab walks and suspended push-ups can't make up the block. At most one strength-type movement is allowed per block.
- **Cardio finisher:** the same aerobic rule applies. No push-up or crunch finishers.
- **Mobility & Stability main work:** active mobility and stability only, like CARs, dead bugs, bird dogs, clamshells and controlled balance. Pure passive stretches belong in the Cool Down.
- **Recovery and Mobility & Stability dose:** at most 4 sets per exercise. Long rounds of "6 sets × 10 reps" are capped, and the time is filled with fewer, longer holds or flows.
- **Challenge:** it already bans static holds. Crunch-type isolation now counts as weak Challenge vocabulary, so full-body bodyweight moves come first.

## 2. Fix every workout

- Re-audit all 530 against the new rules.
- **Swap-only pass**, free: same movement pattern, priority exercises in Main and Finisher only, and prep exercises in Activation and Cool Down only.
- **Stuck workouts.** These are the ones the swap can't fix. They include the 6 left last time:
  - Foundation Forge, Cadence Ground, Lower Body Pillar and Legion Ascent (short on priority exercises)
  - Anchor Precision Flow (activation too long)
  - Cadence Helix Flow (cool down too long)
- **How stuck workouts get fixed:**
  - Priority share: more of the right priority exercises are allowed across nearby movement patterns. If that's still short, a non-priority line is replaced with a priority one.
  - Activation or Cool Down too long: reduced to 3 to 4 movements at 30 to 45 seconds.
  - Anything still failing is rebuilt section by section with the same rule engine, the same as a newly generated workout. Name, picture, category, format, duration, level and equipment stay the same.
- Every workout is backed up before saving.

## 3. Check it was done

- Re-audit the live data. The target is 530 of 530 with zero rule breaks.
- Read one workout per category, plus Athletic Challenge Builder, Deep Stretch & Decompress, Cadence Warp and Flow Foundation. This catches anything the rules still miss. If something looks wrong, the rule is added and steps 2 and 3 are repeated.
- Confirm all pictures still link, the Workout of the Day schedule and which workouts are shown are unchanged, and all tests and the build pass.
- Add tests for each new rule, with examples of the Recovery, Cardio and Mobility cases above.

## 4. Report

Final report:
- the count fixed, by category
- confirmation of 530 of 530 compliant
- the list of new rules
- before-and-after examples

The live website gets the changes after you publish.

## Technical details

- New checks go in `src/lib/workout/rules.ts`, using the shared patterns in `doctrine.ts`. Rules are not added anywhere else (the existing test enforces this):
  - `RECOVERY_BAN_RE` extended (dumbbell, curl, press, loaded step-up, lunge with load)
  - an aerobic-majority check for Cardio main and finisher (`AEROBIC_RE` share ≥ 60%)
  - a passive-stretch ban in Mobility & Stability work rows
  - a dose cap (≤ 4 sets) for Recovery and Mobility & Stability
- `smarty-compliance.ts`:
  - widen priority candidates to adjacent patterns when no same-pattern candidate exists
  - a prep-section shrink step for overflow
  - for workouts still failing, a per-section fallback through `generateWorkoutContent`'s library-only path, keeping metadata
- Script output: backup `audits/smarty-workouts-pre-final-2026-10-02.json`, report `audits/smarty-workouts-final-2026-10-02.json`.
