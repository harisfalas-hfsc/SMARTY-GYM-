# Full rule audit and repair of all 530 Smarty Workouts

Zero AI credits. The deterministic engine (the same one Smarty Coach uses) does every check and every fix.

## Guiding principles
- **Audit first, change only if needed.** A workout that already follows all the rules is left exactly as it is.
- **Your full rule set decides everything.** The examples you gave (Tabata, For Time, Circuit, leg extension, deadlifts, etc.) are just illustrations, not a checklist. Every rule already in the engine applies, for every format: Tabata, For Time, Circuit, AMRAP, EMOM, Sets & Reps, Reps & Sets, Ladder and every other one.
- **Formats are never changed.** Each workout keeps its own format and structure. No workout is made to look like another.
- **Only exercises are corrected.** Each replacement must be legal for the workout's category, format and equipment (bodyweight or equipment), and must come from the exercise lists you chose for that category.
- **Activation, warm-up and cool down** are fixed only by their own rules (no equipment; mobility, stability and stretching moves from the approved prep lists).
- **Descriptions, tips and coaching text are never rewritten.** A replacement exercise must also fit what the text already says (for example, "fast" text never gets a slow exercise).

## What stays untouched
Names, pictures, categories, formats, structure, durations, levels, IDs and all text.

## Steps
1. **Full backup** of all 530 workouts (can be restored).
2. **Audit all 530** against the complete rule set. List what breaks which rule and where.
3. **Repair only the workouts that fail**, swapping only the exercises that break a rule. Each swap keeps the same movement pattern, body area, equipment and training intent, and matches the description. Unsafe swaps stay blocked.
4. **If a workout can't be fixed confidently,** leave it unchanged and list it for you to review. No forced swaps.
5. **Re-audit all 530,** then send you an honest report: how many were already compliant (untouched), how many were repaired with before/after exercises, and any left for your review.
6. Run all automated checks and the build.

## Technical details
- Audit and repair use the existing single path: rules.ts (doctrine.ts, prep-vocabulary.ts, the closed category vocabularies) plus planMigration/bannedSwap in smarty-compliance.ts. No rule changes.
- planMigration runs only on workouts the audit marks non-compliant. Format, structure, sets, rounds and timing are kept. Only exercise identities change, plus dose when a rule requires it.
- Description fit is a ranking filter on candidate swaps (it reads the existing text for fast/explosive vs controlled/tempo cues). It never edits text and never overrides doctrine.
- The backup goes into a dated pre-migration backup table and can be reversed.
