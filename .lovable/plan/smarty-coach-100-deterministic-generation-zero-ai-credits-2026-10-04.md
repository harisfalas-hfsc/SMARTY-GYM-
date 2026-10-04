# Smarty Coach: 100% deterministic generation (zero AI credits)

## Goal
Smarty Coach creates workouts entirely with the deterministic engine — no AI call, no AI credits — with descriptions, instructions and tips modeled on your existing Smarty Workouts, and a mandatory member-chosen workout name.

## What changes

### 1. Generation path
- `generateWorkoutContent` skips the AI attempt entirely: the pack engine becomes the only path for Smarty Coach, WOD and admin generation.
- Enforcement and validation stay exactly as today (they already run on the pack output).
- The 18s AI attempt and its credit cost disappear; generation becomes near-instant.

### 2. Copy modeled on existing Smarty Workouts
Instead of generic templates, the engine learns from your real 530 Smarty Workouts:
- Build a copy bank by extracting the description, instructions and tips from existing Smarty Workouts, indexed by category, difficulty level and equipment mode (bodyweight vs equipment).
- When generating, pick the closest-matching workout's texts (e.g. Strength + beginner + bodyweight) and adapt them deterministically to the member's selections: duration, focus, equipment, mood. Adaptation is factual substitution only — no invented claims.
- Fallback to the existing template copy when no close match exists for a combination.
- All texts follow the same copy rules as the rest of the site (no internal mechanics, no banned phrasing).

### 3. Mandatory "Name your workout" step
- After Smarty Coach finishes generating, a new required step appears: "Name your workout."
- The member must enter a name to proceed — it cannot be skipped or left blank (validated with a sensible length/character check).
- This member-chosen name becomes the workout's permanent name — in the logbook, when shared, everywhere. It is not auto-renamed later.
- The engine's internal name is only a placeholder until the member names it.

### 4. Locked labels and tags
- Category, difficulty level, equipment, format, duration and all other labels/tags are set by the system and cannot be edited by the member — only the name is theirs.
- Admin editing rights in the admin panel are unchanged.

### 5. What does NOT change
- Exercise selection, dosing, sets/reps, structure, all rule engines, validation, publish gates — untouched.
- Exercise "how to perform" content — still from the exercise library's own descriptions/instructions/GIFs.
- The 530 saved workouts — untouched, no re-migration.
- Admin manual creation and member Build It Yourself — untouched (Build It Yourself already lets members name their workout).

## Technical details
- Files: `src/lib/workout/generate.server.ts` (remove model path), `src/lib/workout/pack.server.ts` + new `src/lib/workout/copy-bank.ts` (extracted Smarty Workout texts + matching/adaptation), `src/routes/_authenticated/create-your-own-workout.tsx` (mandatory naming step), `src/lib/coach.functions.ts` / `create.server.ts` (accept and store the member's name).
- The copy bank is built at generation time from the workouts table (cached), so it stays current as you add Smarty Workouts.
- `prompt.server.ts` / AI gateway become unused by workout generation; left in place but disconnected to minimize risk.

## Verification
- Full test suite, typecheck and production build.
- Generate sample workouts across categories/levels/equipment and confirm: valid structure, copy that reads like your Smarty Workouts, zero AI gateway calls, mandatory name step blocks progress until filled, name persists, labels locked.
