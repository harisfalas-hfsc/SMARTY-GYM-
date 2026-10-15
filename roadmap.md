# Roadmap

- [ ] Unify Smarty publishing into one announcement per action, with category/collection links, retry protection, delivery reporting and tests; do not publish real workouts during verification.

- [x] Add admin workout filtered totals and explicit selection-scoped show/hide controls; real admin shows 50 hidden Muscle Building results and all/individual selection, member archive selects all 166 across pages. Bulk stays silent, individual Show warns about per-workout announcements. No visibility changes or emails triggered; 440 tests pass and build OK.

- [x] Muscle-match rule from library data, no exercise repeated across sections, Cool Down matching trained muscles, finishers ≥3 exercises at 3–4 sets; all 531 Smarty Workouts audited, 138 fixed (backup first), 0 failing; member workouts untouched; 427 tests pass.

- [x] Unify the Coach photo and visitor-sized scrolling frame across all access levels; visitor phone/desktop and real Premium photo/scroll-to-action checked, inactive presentation and Account action checked with a browser-only locked snapshot (no account changes); 39 tests pass and build OK. Live inactive account not exercised in this turn.

- [x] Add the existing About coach photo to visitor and non-Premium Coach announcements; visitor phone/desktop and real signed-in non-Premium phone checked, sign-in action checked, 39 tests pass and build OK. Premium presentation branch untouched; live Premium check unavailable with the current non-Premium session.

- [x] Standardize Reader/Save/Share with public-only canonical links and header pictures. Real signed-in shared/private/Smarty workouts checked on phone/desktop; both photo/no-photo pictures inspected, private legacy links hidden and visitor community gate checked; 24 targeted tests pass and build OK. Native payload intercepted in browser; delivery through installed social apps/native binaries remains unverified.

- [x] Standardize signed-in Coach cards, center the two-line greeting, and show a clear scroll affordance; verified signed-in phone/desktop, 13 tests and build. Current 9/10 reflects today's 5/10 check-in self-rating; the earlier 10/10 display cannot be reconstructed.

- [x] Add factual weekly readiness evidence below Check-ins/Coming Up and before Smarty Coach suggestions across Insights, inbox and Monday email; remove the Insights PDF download.

- [x] Correct User Activity reporting so opening, creating, copying, completing, scheduling, favoriting and sharing workouts always use distinct factual labels.

- [x] Upgrade Smarty Coach into an immediate, account-safe daily briefing focused on readiness, last session, today’s target, both Training Profile goals and the evidence behind the recommendation.

- [x] Add the old-style header Smarty Coach button and five-second personal recommendation window connected to profile, check-ins, history, comparisons and records; desktop/mobile active-member flow and access rules verified.

- [x] Match full Insights across app/inbox/email, including thin-line load graphs; owner-only app/inbox checked at desktop/phone and email rendered and inspected.

- [x] Match Insights and training graphs to lightweight lines in the website and email; calculations unchanged.

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
- [x] Smarty Insights: persistent Logbook section, Monday 06:00 inbox + email report, account email switch, no PDF download
- [x] Insights compliance fixes (dedupe/retry, tip priorities, real Training Load, acceptance tests); reports stay in each member's own timezone, sent at their local Monday 06:00
- Daily user activity report (00:30 Cyprus) + Admin User activity section — done
