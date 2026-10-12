# Fix what the workout player asks you to log

Nothing will be built until you approve this plan.

## The problem today
- If an exercise name contains "run", "sprint", "row", "bike", "walk" or similar AND has any time on it (e.g. "20 sec sprint", "30 sec shuttle run"), the player asks for **Distance (m)** and **Seconds held**. That's wrong: the time was already set in the workout.
- Every timed step is labelled **"Seconds held"**, even when nothing is being held.
- Tabata, EMOM and work/rest circuits ask for numbers the timer already knows.

## The new rules (one per type of step)

| What the step is | What the player asks |
|---|---|
| Loaded lift with sets and reps (e.g. 4 x 8 Barbell Squat) | Reps + Weight (kg), per set |
| Bodyweight sets and reps (e.g. 3 x 12 Push-Up) | Reps, per set |
| Countable move in a fixed time (Tabata 20 sec, circuit 40 sec on / 20 off) | **Reps done in that time** only. The seconds are filled in automatically from the workout. |
| Real hold (Plank, Wall Sit, Dead Hang, Side Plank) | Seconds held |
| Set distance prescribed (500 m row, 1 km run) | **Time taken** only. The distance is filled in automatically. |
| Set time prescribed for cardio (e.g. 10 min bike) | Distance covered, only for machines/runs where it makes sense. Optional. |
| Circuit "20 push-ups, 20 squats, 20 sit-ups x 5 rounds" | Nothing to type per exercise. Reps are counted automatically: 100 each. Loaded moves ask only for weight, once. |
| AMRAP | Rounds + extra reps (workout result) |
| For Time | Time to finish (workout result) |
| Warm-up, activation, cool down, Recovery | Done / not done only |

Short moves like bear crawls, shuttle runs and sprints that are done for a time count as "countable move in a fixed time". They never ask for distance or "seconds held".

## How training load uses this (no change to the formula)
- Strength load still comes from reps x weight.
- Conditioning load still comes from session effort (RPE) x duration. Duration comes from the workout's own timing, not from typing.
- Reps you enter are used for your progress and records only.

## Checks before I report back
1. Run every one of the 530 Smarty Workouts through the new rules and list how each step is classified. Any step that doesn't fit cleanly gets reported to you. No guessing.
2. Open the player and the "Log your performance" window on a phone signed in as you, for one workout of each format: Sets & Reps, Tabata, EMOM, Circuit, AMRAP, For Time, and one with a distance. Take screenshots.
3. Confirm past logged sessions still show correctly.
4. Run all tests and the build.
5. Desktop layout stays the same. Only the fields change.

## What will not change
Workouts, exercises, formats, descriptions, the player design, the training load formula, and data you've already logged.

## Technical details
- `src/lib/workout/tracking-model.ts`: distance only when `planned.distanceM` is set. Distance-prescribed steps become `primary: "duration"` (time taken), and the distance is stored automatically. Countable-in-window steps become `reps_in_time`, and seconds are auto-filled from `windowSeconds`. "hold" is limited to `HOLD_WORDS`. Add a `fixedReps` case for round-based circuits (reps x rounds) so no per-move input is needed.
- `PerformanceEditorDialog.tsx` + player logging: labels driven by the metric ("Reps in 20s", "Seconds held", "Time taken", "Distance covered"). Auto-filled values are sent but not shown as inputs.
- New unit tests per scenario in the table above, plus an audit script over all 530 workouts.
