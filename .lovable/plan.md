# Fix finisher length in all workouts + start beep in the player

## 1. Finishers: real length by level

Rule (applies to every Smarty Workout that has a finisher — 425 of 531; the 106 without one stay as they are):

| Level | Minimum finisher |
|---|---|
| Beginner (1 star) | 12 minutes |
| Intermediate (2 stars) | 15 minutes |
| Advanced (3 stars) | 20 minutes |

- The finisher's time must add up for real: rounds × (work + rest) per exercise, plus rest between rounds. No more "5 minutes" written on 3 rounds of 20 seconds.
- Everything else in the workout stays the same (preparation, activation, main workout, cool-down, descriptions, tips, format). The workout's listed total time grows by the extra finisher minutes.
- Every rewritten finisher keeps your rules: closed exercise lists per category, priority exercises, focus labels for Strength, no awkward movements (bear crawls, travelling runs in Tabata, etc.), format kept (Sets & Reps stays Sets & Reps, EMOM stays EMOM), simple plain wording a normal person understands at a glance.
- A backup of all workouts is taken before any change.
- Unstarted personal copies in members' Logbooks pick up the new version; copies with logged training stay untouched.

Going forward, the same rule is enforced for new and edited workouts:
- Workout generation (Coach/admin/WOD) builds finishers to the minimum.
- The publishing check blocks a finisher below the minimum or whose stated time doesn't match its real math.

## 2. Player: beep when Start is pressed

Today pressing Start only switches sound on silently; the first beep comes at the end of the first work interval. Change: pressing Start (and Resume at the start of a new interval) plays the same Smarty Tools beep immediately, so the member hears that the work has begun. Beeps at the end of every work and rest stay as now.

## Verification

- Full audit of all 531 workouts after the change: every finisher meets its level minimum, its time math matches, and all existing rules still pass; report counts and any names that fail.
- Open a sample of rewritten workouts per category and level on a phone-sized screen.
- Player check: Start on Kinetic Vortex Tabata produces a beep at 0s, then at 20s and 30s.
- Tests and build run clean.

## Technical details

- Finisher duration helper (rounds × (work+rest) + between-round rest) added to the workout rules module and used by the generator, `publicationRuleReports`/compliance gate and the audit script.
- Data repair via a script over `smarty_workouts.main_workout` finisher section + `duration_min`/`duration_label`, with backup table `smarty_workouts_backup_finishers_20261013`.
- `WorkoutPlayerDialog.tsx`: call `playTimerBeep()` on the Start tap when a timed phase begins (after `unlockTimerBeep()`).
