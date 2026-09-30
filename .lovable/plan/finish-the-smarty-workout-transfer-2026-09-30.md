# Finish the Smarty Workout transfer

## Goal
Make the 529 transferred workouts safe to publish and make their administration clear and complete.

## Changes
- Add a permanent full-transfer audit covering categories, formats, metadata, ordered sections, player steps, library links, exercise details/media, cover images, filters, and duplicate legacy IDs.
- Repair every audit failure automatically where the source data or an exact library equivalent exists; keep all transferred workouts hidden during repair.
- Restore the one missing workout cover and ensure every referenced exercise has a working demonstration or an explicit verified media replacement.
- Add clear bulk **Show all transferred** and **Hide all transferred** controls with confirmation, plus individual View/Edit/Duplicate/Show/Hide/Delete controls.
- Remove obsolete transfer-only checking/publishing code and avoid showing confusing one-time import/check controls.
- Harden duplicate format/category compatibility and Smarty favorite state across repeat attempts.
- Add automated regression tests for import integrity, parsing, visibility controls, and member player/performance behavior.

## Verification
- Run the full 529-workout audit and save its report.
- Confirm zero broken library links, zero missing required sections, zero missing covers, zero missing referenced exercise demonstrations, correct category/filter metadata, and all imported workouts hidden until the final checks pass.
- Test admin controls and open representative workouts from every category through the normal member player.
