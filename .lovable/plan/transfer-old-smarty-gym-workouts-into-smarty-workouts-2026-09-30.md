# Transfer old SMARTY GYM workouts into Smarty Workouts

## What gets transferred
- Categories: Strength, Challenge, Calorie Burning, Metabolic, Cardio, Mobility & Stability, Pilates, Recovery (Recovery goes into Mobility & Stability).
- Excluded: Micro-Workouts, training programs, all prices and standalone-purchase settings.
- About 528 workouts, each with its name, category, focus, format, equipment, duration, difficulty, full content (soft tissue, activation, warm-up, main workout, finisher, cool-down), description, instructions, coach tips and cover picture.

## How it will look afterwards
- Every workout sits in Admin → Workouts → My Smarty Workouts, editable in the same editor, with Preview, Hide/Show, Duplicate and Delete.
- Members see them in the right category pages with the same card design, filters and player (reps, load, logging).
- Transferred workouts start **hidden**, so you can check them before they go live. One "Show all transferred" button publishes them together when you are ready.

## Steps
1. Confirm full access to the old workout content. Public access only shows 35 complete workouts, because premium content is masked. The full text needs the old project's admin access. If I cannot get that access, I will stop and tell you before anything is copied.
2. Add an admin-only "Import from old SMARTY GYM" run in the Admin Panel. It copies in batches and can be re-run safely: each old workout is tagged with its old id, so it never creates duplicates.
3. Copy each cover picture into this project's own storage, so nothing depends on the old site. If a picture fails, the workout is still imported without it and listed in a report.
4. Convert the content to this project's format. Exercise links like `{{exercise:ID:Name}}` are checked against this project's exercise library. Exercises that don't match stay as plain text and are listed in the report. No exercise is invented.
5. Normalise the tags: difficulty becomes 1–3 (Beginner/Intermediate/Advanced), sets-and-reps categories use the REPS & SETS format, and equipment names are mapped to this project's equipment list.
6. Verify: count the imported workouts per category against the old counts, open several workouts in each category (card, page, player, logging), and run the tests and build.

## Technical details
- New column `smarty_workouts.legacy_id text unique` (migration) for idempotent upserts.
- New server function in `src/lib/smarty-workouts-import.functions.ts`, admin-checked. It reads the old data using the old project's service credentials, which get stored as a secret. The server-side importer and the image copy go in `*.server.ts`, and images use the existing workout-cover bucket and route.
- The import report (imported, skipped, missing images, unmatched exercises) is shown in the admin tab.
