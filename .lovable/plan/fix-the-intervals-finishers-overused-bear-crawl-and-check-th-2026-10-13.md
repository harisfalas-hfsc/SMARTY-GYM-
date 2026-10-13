# Fix the "Intervals" finishers, overused Bear Crawl, and check the rules and Training Load

## What went wrong (checked in the live data)

- "Intervals" is not one of your formats. I made it up when I lengthened the finishers. It is now the finisher heading in **276 workouts**: Calorie Burning 64, Cardio 61, Challenge 87, Metabolic 64.
- Before my change, 258 of those finishers were **For Time**. The other 18 had only "5 minutes" as a heading and no format at all.
- The 149 Strength finishers are **Reps & Sets**, which is correct. They stay that way.
- Bear Crawl is on your 60-exercise conditioning list, but it is overused. It appears in **191 of 531 workouts**: Challenge 86, Metabolic 54, Calorie Burning 37, Cardio 14. It is in the finisher of 101 of them.

## 1. Choose each finisher's format workout by workout

Every finisher will use one of your formats that is allowed for its category: Circuit, Tabata, AMRAP, EMOM or For Time. Each workout gets its own decision, based on its category's purpose, level and main workout, using these fixed rules:

| Category | Purpose of the finisher | Format choice |
|---|---|---|
| Cardio | Keep a steady pace you can repeat | EMOM or Circuit (rest is built in, pace stays even) |
| Calorie Burning | Keep output high, use lots of energy | AMRAP or Tabata |
| Metabolic | Hard work with planned recovery | EMOM or Tabata |
| Challenge | A test to finish | For Time with a time cap, or AMRAP |

Tie-breakers, applied in this order:
1. The finisher must not use the same format as the main workout, so the session doesn't repeat itself.
2. Beginner workouts get formats with built-in rest (EMOM, Circuit, Tabata). Advanced workouts can use For Time or AMRAP.
3. The finisher keeps its own exercises, stays within your priority lists, and adds no new equipment.
4. Your minimums still apply: 12 min for Beginner, 15 for Intermediate, 20 for Advanced. The time each finisher states must match its real math.

The finisher text will be short and plain, for example: "EMOM 15 min: odd minutes 12 Jump Squats, even minutes 30 sec High Knees."

The same rules will apply to all new workouts, and "Intervals" will be removed from the workout builder. Any finisher whose format isn't one of yours will be blocked from publishing.

## 2. Stop repeating exercises (Bear Crawl and others)

- Count how often every exercise is used across all workouts in each category.
- Set a fair-share limit so no single exercise dominates. For example, no exercise in more than about 15% of a category's workouts, and never twice in the same workout.
- Rebalance the workouts that go over the limit by swapping in less-used exercises from your own lists. Each swap must keep the same movement type, equipment and level.
- Add the same limit to the workout builder so this can't build up again.

## 3. Check yesterday's repairs against your rules

Recheck these against your closed lists, priority exercises, focus labels and category rules:
- the 17 Strength finishers I filled up to 3 exercises
- the 7 cardio exercise swaps
- the 170 description and tip rewrites

## 4. Check the player's Training Load after the latest changes

- Run real test entries through Sets & Reps, Tabata (each interval logged), Circuit, AMRAP, EMOM, For Time, distance runs and holds.
- Confirm that Training Load counts every round or interval actually done, never just one, and that bodyweight work is never given made-up weight.
- Confirm that the saved Logbook entries show the same numbers.

## 5. Report back with real counts

You'll get:
- how many finishers got each format, and why
- every Bear Crawl and other overused exercise I swapped, by workout name
- any rule violations found and fixed
- the Training Load test results

I'll also open a sample on a phone-sized screen. I will be clear about which checks are data checks and which workouts I actually opened.

A full backup will be saved before any change. Unstarted Logbook copies get updated; copies with logged training stay as they are.

## Technical details

- The "Intervals" finisher comes from `buildFinisherHtml` in `src/lib/workout/finisher-length.ts`. It will be replaced by a deterministic `chooseFinisherFormat(category, stars, mainFormat)` and format-specific builders (EMOM, Circuit, AMRAP, Tabata, For Time with cap). The time math still lives in `finisher-length.ts`.
- `complianceIssues` in `smarty-compliance.ts` will add two checks: the finisher format must be in `LEGAL_FORMATS[category]`, and each exercise must stay under its usage cap. `programming.ts` and `pack.server.ts` will use the same chooser.
- The repair backs up `smarty_workouts` first. It rewrites the finisher blocks, then the matching description, instructions and tips sentences, then the unstarted copies in `workouts`.
- Tests to add or extend: finisher format chooser, exercise usage cap, and Training Load per format in `tracking-model` and `parse-steps`. After that, a full run of all tests, a build, and a fresh audit of all 531 workouts.
- `AGENTS.md` and `mem://features/finisher-length` will be updated to record the format rule.
