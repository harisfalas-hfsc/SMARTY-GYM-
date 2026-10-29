# Cadence Awaken Flow: what happened and the fix

## What I found
- "Cadence Awaken Flow" is one of your Smarty Workouts (Cardio, published). The member did your workout. He did not create it. No member has saved results on the copy yet.
- Its Main Workout uses Mountain Climber, Swing 360, Short Stride Run and Butt Kicks. Its Finisher uses Run, Jumping Jack, Squat Jump and High Knees.
- **Butt Kicks (#7), Short Stride Run (#23) and Swing 360 (#60) are all on the 60-exercise conditioning list you gave me on 4 October.** The system followed that list. It did not invent these exercises.
- The real problem is **Swing 360**. Its library record says "bodyweight: swing your arms in circles while you rotate your torso". But its picture shows a swing on a bar, going up and down. The picture and the description don't match, so the exercise makes no sense in a cardio workout.
- Butt Kicks is a normal running drill (heels kick up toward the glutes), and it is on your list.

## The fix
1. **Take Swing 360 off the approved conditioning list** for every future Smarty Workout, Coach workout and admin workout, and stop it from being published.
2. **Find every Smarty Workout that uses Swing 360**, plus any other exercise that is off your lists, and swap each one for a matching exercise from your list (same section, same time or reps, no repeats). Back up each workout before the change. Cadence Awaken Flow gets fixed first.
3. **Keep Butt Kicks and Short Stride Run**, because they are on your list. Tell me if you want either one removed too, and it gets the same treatment.
4. **Members' own saved workouts, Logbooks and history stay untouched**, as you require. Only Smarty Workouts and future workouts change.
5. Run a full check of the library afterwards so every published Smarty Workout passes, then run all tests.

## Technical details
- Remove "Swing 360" from `CONDITIONING_EXERCISES` in `src/lib/workout/conditioning-vocabulary.ts` and update the memory list (59 approved).
- Back up `smarty_workouts` to a new table, then replace `{{exercise:3318:...}}` tokens using the existing deterministic replacement pool in `rules.ts`, checked by the publish gate.
- The mirrored row in `workouts` (f706c375…, 0 results) gets the same swap, because it is the published copy of the Smarty Workout and not a member's own workout.
- Re-run the full-library compliance audit and vitest.
