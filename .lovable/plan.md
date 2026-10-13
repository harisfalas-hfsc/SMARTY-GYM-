# Fix Tabata/circuit round logging, Tabata exercise choice, and add timer sound switch

## What is wrong today (checked)
- Kinetic Vortex Tabata writes each step as "20 sec run — 4 intervals". The player shows "Reps in 20s" with one box, so it is unclear whether you type one interval or all of them.
- Training load only counts what is logged. Each tap of "Log" saves one row. If you log once, only one 20-second interval (and its reps) is counted, not all 4 (or 8). Circuits work the same way: rounds you do not log are not counted. Nothing is multiplied automatically.
- The workout repeats Block A, B, C, so "run / broad jump" appears twice by design of that workout text — and "run" is a poor Tabata choice on a fixed spot.
- The timer already has an internal beep counter but no audible sound and no on/off switch.

## 1. Clear round logging (Tabata, EMOM, circuits, AMRAP)
- The player reads the stated count ("4 intervals", "8 rounds", "x 5 rounds") and shows "Interval 2 of 4" / "Round 3 of 5" next to the timer.
- Label becomes "Reps this interval (20s)" or "Reps this round". Each interval/round is logged separately and numbered, so you see e.g. "3 of 4 logged".
- Optional shortcut: "Same for all remaining" fills the rest with the last value, so you never have to type 8 times.
- Training load: every logged interval/round counts. Total reps = sum of all logged rounds; working time = interval length x intervals actually logged. Unlogged rounds are shown as "not logged", never invented. The Training Load science page gets one short paragraph stating this.

## 2. Tabata and timed-interval exercise choice
- Remove locomotion moves that don't fit a fixed spot (run, sprint, shuttle) from Tabata/EMOM intervals; use the closed Conditioning list (e.g. high knees, jumping jacks).
- Rule: inside one Tabata workout, a movement may appear in only one block, unless the workout states repeats; repeated blocks must use different pairs.
- Audit all Tabata workouts, repair failing ones (keep format, timing, descriptions), report names repaired. Kinetic Vortex Tabata fixed first.

## 3. Timer sound switch
- One speaker button in a fixed spot in the player's top bar, beside Close, the same on every slide. Fixed size, never overlapping titles (long names wrap/shorten).
- Short beeps at 3-2-1 and on work/rest change and finish. Remembered on the device; off by default until you turn it on (phones block sound until a tap).

## Verification
- Tests for interval/round counting, load totals across rounds, Tabata rules.
- Open Kinetic Vortex Tabata and one circuit in the player on phone and desktop; log several intervals, check Logbook totals and Training Load.

## Technical notes
- `tracking-model.ts`: parse "N intervals/rounds" into `roundsTotal`; `WorkoutPlayerDialog.tsx`: round indicator, per-round set_number, fill-remaining, sound toggle via Web Audio + localStorage.
- `load.ts` already sums all logged rows; add tests proving multi-round sums.
- Tabata audit/repair via the existing enforce/publish checks with backups.
