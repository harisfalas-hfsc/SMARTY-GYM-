# Smarty Coach: 100% deterministic generation (zero AI credits)

## Goal
Smarty Coach creates workouts entirely with the deterministic engine — no AI call, no AI credits — while keeping rich, coached-sounding descriptions, instructions and tips.

## What changes

### 1. Generation path
- `generateWorkoutContent` skips the AI attempt entirely: the pack engine becomes the only path for Smarty Coach, WOD and admin "Generate with AI" (renamed behaviour, same button).
- Remove the `deterministic` flag branching and the model call from the workout path; keep enforcement + validation exactly as today (they already run on the pack output).
- The 18s AI attempt and its credit cost disappear. Generation becomes near-instant.

### 2. Rich template copy library
Replace the current generic `packCopy` texts with a template bank that writes natural, varied prose from known facts:
- **Description** — varies by category (9 categories), level (beginner/intermediate/advanced), mood, focus and duration. Several phrasings per combination, rotated deterministically so consecutive workouts don't repeat wording.
- **Instructions** — per format (REPS & SETS, AMRAP, EMOM, TABATA, CIRCUIT, etc.): how to move through the sections, rest discipline, pacing.
- **Coach tips** — 3-4 tips chosen from a curated pool matched to category, level, equipment mode and mood (e.g. sore → warm-up emphasis; advanced → tempo/quality cues).
- No internal mechanics, no banned phrasing in any template (same copy rules as the rest of the site).

### 3. Workout names
- Curated word-bank name generator (creative 2-word names in the style of existing Smarty Workouts), checked by the existing `isValidName` rules (no repeats per athlete, banned words, no codes/numbers).
- Bank sized so repetition across a member's history is rare; fallback descriptive name kept for edge cases.

### 4. What does NOT change
- Exercise selection, dosing, sets/reps, structure, all rule engines, validation, publish gates — untouched.
- Exercise "how to perform" content — still comes from the exercise library's own descriptions/instructions/GIFs.
- The 530 saved workouts — untouched, no re-migration.
- Admin manual creation and member Build It Yourself — untouched.
- AI stays available for nothing else in workout creation; other AI features (if any) unaffected.

## Technical details
- Files: `src/lib/workout/generate.server.ts` (remove model path), `src/lib/workout/pack.server.ts` (rich `packCopy` + name bank), possibly a new `src/lib/workout/copy-bank.ts` for the template data.
- `prompt.server.ts` and the AI gateway import become unused by workout generation; left in place but disconnected (removal optional, kept to minimize risk).
- Tests: update engine tests that expect an AI attempt; add tests covering copy variety, name validity, and that no network/AI call is made.

## Verification
- Run full test suite, typecheck and production build.
- Generate sample workouts across several categories/levels/moods and confirm: valid structure, varied non-repetitive copy, valid unique names, zero AI gateway calls.
