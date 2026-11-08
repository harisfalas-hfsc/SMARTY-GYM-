# Apply the uploaded workout-by-workout corrections

Apply exactly the replacements listed in your document to the named published Smarty Workouts. No general audit, no other changes.

## What will happen
1. Read every workout title and its replacement lines from your document.
2. Take a fresh backup of all published workouts (the existing backup stays untouched).
3. For each named workout, in Main Workout and Finisher only, swap every occurrence of each named exercise for the listed target. Sets, reps, time, rounds, rest, order, format, title, category, level, duration, equipment and descriptions stay exactly as they are.
4. Before each swap, confirm the target exists in the exercise library and is on the approved priority list (or a real alias). If it is not, or the swap would create a duplicate and no listed alternative is free, that case is left unchanged and put on an exception list for you.
5. Preparation, activation, warm-up, cool-down, members' own workouts, Logbook and history are never touched.
6. Read every changed workout back from the live database to confirm each swap saved.
7. Run the full test suite.

## What you get
- A report document: workouts changed, swaps made per workout, exceptions (with reason), read-back result, test result.

## Not included
- The earlier staged 958-swap proposal is not used; only your document's list is applied.
- The 7 failing rule checks from the earlier attempt are fixed only if they block the test run; no new rules are added.

## Technical details
- Parse the docx with pandoc into (title, category, from → to) rows; match workouts by exact title + category in `public.smarty_workouts`.
- Backup to a new table/JSON snapshot; update section JSON exercise references (name + library id/media) only.
- Validate targets against `src/lib/workout/priority.ts` resolver and active library rows.
