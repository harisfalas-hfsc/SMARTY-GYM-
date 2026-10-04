# Full rule audit and repair of all 530 Smarty Workouts

Zero AI credits — the deterministic engine (same as Smarty Coach) does all checks and fixes.

## What stays untouched
- Names, pictures, categories, formats, durations, levels, IDs
- Descriptions, tips, instructions and all coaching text — never rewritten

## Steps
1. **Full backup** of all 530 workouts before any change (restorable).
2. **Audit all 530** against your established rules: closed exercise lists per category, bodyweight/equipment separation, prep (activation/cool down) vocabulary, section legality, dose and structure.
3. **Format fit check** — every exercise must suit the workout's format:
   - Tabata / timed formats: fast, flowing, full-range moves only — no isolation machines (e.g. no leg extension).
   - For Time: no heavy setup lifts or station machines (e.g. no back squat, no cable rows).
   - Circuit: quick-transition moves — no heavy barbell/machine lifts (e.g. no deadlifts, no leg press).
4. **Description fit check** — any replacement must match what the description already says (e.g. "fast / explosive" text gets fast exercises; "controlled / slow" text gets controlled exercises). The text drives the choice; the text itself is never edited.
5. **Repair** only rule-breaking exercises, swapping each for a legal one with the same movement pattern, body area, equipment and training intent. Unsafe substitutes stay blocked.
6. **Any workout that cannot be fixed confidently** is left unchanged and listed for you, rather than forcing a bad swap.
7. **Re-audit** to confirm results, then give you an honest report: how many were already compliant, how many were repaired (with before/after exercises), and any left for your review.
8. Run all automated checks and the build.

## Technical details
- Repairs go through the existing single repair path (planMigration in smarty-compliance.ts) on rules.ts — no rule changes.
- Format fit uses the existing flow/format rules (flowSpecialtyViolation); description fit adds a reporting-and-selection filter that reads description keywords (fast/explosive/quick vs slow/controlled/tempo) to rank candidate swaps — it does not alter doctrine.
- Backup into a dated pre-migration backup table; reversible.
