# Roadmap

- [x] Use the mobile carousel images for the four matching desktop homepage sections, add Shared Workouts and Smarty Ritual, and keep About mobile-only.

- [x] Replace and visually verify four Smarty Workouts category photos on phone and desktop.

- [x] Add Smarty Workouts to mobile and desktop About without changing the desktop homepage.
- [x] Explain Smarty Workouts in How It Works and FAQ, with links and accurate access wording.

- [x] Replace the mobile About carousel card with Shared Workouts and a new photo.
- [x] Add a standalone Shared Workouts page and link below Workout of the Day in the menu.
- [x] Verify mobile/desktop navigation and shared-workout browsing without changing Community.
- [x] Compare the old SMARTYGYM startup response and mobile loading behavior with the current project.
- [x] Replace the iOS storyboard handoff and Android post-splash window with an uninterrupted black native surface through the first rendered page.
- [x] Inspect the submitted-app startup recording frame by frame and identify the white native loading view.
- [ ] Confirm the correction on an installed Android and iOS build (blocked until updated store binaries are built and installed).
- [x] Remove Micro Workout from Smarty Coach, including automatic and surprise generation paths.
- [x] Left-align the content inside workout questionnaire choice buttons without changing button layout.

- [x] Import Smarty Rituals (180)
- [x] Replace broken ritual Word/PDF export with real formatted downloads and verify single/all exports.
- [x] Challenge balance + level-consistency enforcement (doctrine/validator/prompt) — done, 179 tests pass
- [x] exercises.smarty_tags migration + backfill + pool preference — done
- [ ] Verify ritual PDF export opens in a real PDF app; Word file in Word
- [ ] Emoji rendering unverified on a real phone (test browser lacks emoji fonts)
- [ ] Installed Android app is an old binary — needs rebuild/resubmission (no store credentials)
- [x] Make WOD delivery immediate and cap manual workout generation before guaranteed fallback.
- [x] Finish and verify all 529 transferred Smarty Workouts: permanent audit, guided/visual demonstrations, missing cover, safe bulk visibility, admin controls, and member player lifecycle.
- [x] Add live Smarty Workout totals to the collection, category cards, homepage, About, How It Works and FAQ.
- [x] Move the live Smarty Workout total into the page description and show number-only category badges.
- [x] Make blocked admin publishing messages identify the exact rule, section, exercise, dose limits, equipment, and required correction without changing workout rules or saved workouts.
- [x] Pre-release audit fixes: server-side membership gate, safe account deletion, Stripe event order, no auto-admin, cron minute, no member cap, PremiumGate retry, CI workflow.
- [ ] Add in-app Change email / Change password to Account (from second audit; awaiting approval)
