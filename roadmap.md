# Roadmap

- [x] Add the old-style header Smarty Coach button and five-second personal recommendation window connected to profile, check-ins, history, comparisons and records; desktop/mobile active-member flow and access rules verified.

- [x] Match full Insights across app/inbox/email/PDF, including thin-line load graphs; real account app/PDF and owner-only inbox/PDF checked at desktop/phone; email rendered and inspected; 285 tests passed. Live weekly delivery not triggered.

- [x] Match Insights and training graphs to lightweight lines in website/PDF reports; real account graphs and downloads inspected at desktop/mobile, all PDF pages rendered, 281 tests pass; calculations unchanged.

- [x] Add two Account email preferences in Daily Coaching; sending filters honor independent opt-outs, mandatory app notices unchanged. Signed-in save/reload verified for both combinations at 1280/384px; original owner preferences restored; 263 tests pass.

- [x] Match workout announcement content across email, app inbox and Admin previews; two realistic owner-only test emails accepted by Resend. Signed-in Admin cards and email layouts checked at 1280/384px; 262 tests pass. No fictional workouts or all-account broadcasts created.

- [x] Match both workout announcement emails to the old design and structure; retain app notices, controls and history. Desktop/phone email previews inspected; 260 tests pass. Live all-account delivery not triggered.

- [ ] Identify original latest-three Smarty Workouts and add Featured Workouts beside Recovery on desktop and below categories on mobile; verify layout, links and access.

- [x] Index the 530 visible Smarty Workout covers and public preview pages with factual, workout-specific search metadata while keeping exercise content Premium-only.

- [x] Audit and upgrade machine-readable search discovery, route inventory, sitemaps, private crawl rules, factual AI descriptions, internal intent phrases, and changed-URL IndexNow delivery without changing page layouts.
- [x] Temporarily exclude research/comparison pages with unverified statistics or rankings from indexing while preserving their appearance.
- [ ] Verify and correct unsupported claims/charts on the existing research/comparison pages before restoring indexing (blocked by source verification and the requirement to preserve visible page appearance).
- [ ] Confirm Google indexes newly discoverable public pages after deployment and recrawl (blocked by Google processing time).

- [x] Standardize visible website and message wording to one-word SmartyGym while preserving capitalization, links, and intentional SEO wording.

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
- [x] In-app Change email / Change password on Account; shared workouts readable only via safe public view
- [x] Add Shared Workouts as “Shared” before Logbook in the phone bottom menu.

- [x] Switch Smarty Coach to 100% deterministic generation (zero AI credits): copy from existing Smarty Workouts, mandatory member-chosen name step, locked labels/tags.
- [x] Standardize confirmations, information windows, announcements and temporary messages with one branded SMARTYGYM presentation; remove browser-native prompts.
- [x] Show PAR-Q warnings only when opening a finished workout to train; show creation method only to the owner, while other members see only the creator's name.
- [x] Keep shared-workout creator cards compact while showing public streaks and earned-badge indicators, including muted empty badge slots, without exposing personal completion totals.
- [x] Add a public Training Load science page and link it from Logbook Progress without changing the calculation.
- [x] Update The Smarty Method and Why Invest in SmartyGym for current features, and add visually verified branded portrait PDF downloads.
- [x] Make both public-page PDFs complete, including all charts and references, and standardize Back navigation on every non-home page.
- [x] Welcome every first-time Premium member once by email and in their inbox, with a branded guide to SMARTYGYM features.
- [x] Smarty Insights: Logbook Progress section, Monday 06:00 inbox + email report, PDF, account email switch
- [x] Insights compliance fixes (dedupe/retry, dedicated PDF, tip priorities, real Training Load, acceptance tests); reports stay in each member's own timezone, sent at their local Monday 06:00
- Daily user activity report (00:30 Cyprus) + Admin User activity section — done
