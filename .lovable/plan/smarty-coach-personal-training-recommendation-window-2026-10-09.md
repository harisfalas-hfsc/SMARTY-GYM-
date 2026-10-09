# Smarty Coach — personal training recommendation window

## Goal
Add the old SMARTYGYM-style Smarty Coach icon beside the notification bell on desktop and mobile. Five seconds after a signed-in member lands in the app, open a concise coaching recommendation that connects the member’s last training, current readiness and next session instead of treating every workout as a fresh start.

## What will be built

### 1. Header button and recommendation window
- Add a circular Smarty Coach icon immediately beside the existing notification bell, matching the old project’s recognizable button while using this app’s current design system.
- The button opens the Coach window at any time.
- Automatically open the recommendation five seconds after a fresh authenticated landing, once per signed-in browser session—not again on every page change.
- Defer the automatic opening while another important dialog is active so check-ins, membership prompts and announcements do not overlap. Manual opening remains available.
- Outside tap and the close control dismiss it consistently with the rest of SMARTYGYM.

### 2. One factual, deterministic coaching snapshot
The window will show a short, scannable sequence:

1. **Coach’s recommendation** — one clear suggestion for today or the next session.
2. **Your last session** — workout name/date and only the performance facts actually recorded.
3. **Compared with before** — previous-attempt comparison, progress or a personal record when supported by stored data; otherwise a clear “not enough comparable data yet” message.
4. **What to do next** — a recommended session direction, effort/load adjustment or recovery choice.
5. **Why this is recommended** — the strongest evidence, such as Training Profile goal/level, available equipment, readiness check-in, recent Training Load, logged performance, feedback, limitations and schedule.

The Coach will never invent a result, assume an unconfirmed missed workout, diagnose health, automatically create a workout, or change the member’s data. It remains a suggestion.

### 3. Connect the existing training feedback loop
- Reuse the existing deterministic coaching and Training Load calculations rather than creating a second formula.
- Build the snapshot from the member’s Training Profile, preferred equipment, limitations, check-ins, completed workout attempts, set logs, feedback, personal records and scheduled sessions.
- Use explicit priority rules so recovery/readiness safety overrides progression, progression overrides variety, and missing data produces honest starter guidance.
- Keep exercise selection and any later workout creation inside the existing unified workout rules and closed category lists.
- Provide one relevant action from the recommendation, such as opening the suggested workout area, Check-ins, Logbook/Progress or Training Profile. The action does not generate anything automatically.

### 4. Access and empty states
- Full personalized recommendations remain available only where the current member access rules permit training features.
- Signed-out visitors do not receive the timed window.
- Expired members do not regain access to protected history; the button presents the existing renewal path without exposing locked training data.
- New members with no history receive profile-based starter guidance and a factual explanation that comparisons will appear after logged sessions.
- A failed recommendation request shows a quiet retry state without blocking navigation or sending a false crash report.

## Technical details
- Add one authenticated server function returning a plain `SmartyCoachSnapshot` DTO; all private history reads stay server-side under the existing membership boundary.
- Keep recommendation ranking in pure deterministic functions so it is testable and uses zero AI credits.
- Reuse existing performance comparison, Training Load, readiness/check-in and coaching-rule modules; add personal-record and schedule evidence only to the presentation snapshot.
- Keep the header control and dialog as focused components, mounted once with navigation so they work consistently on every authenticated page.
- Record the architectural rule that the header Coach is a read-only deterministic recommendation surface, not another workout generator.

## Verification
- Test: new account/no history, normal active member, member with low readiness, progression-ready member, personal-record case, missing check-in, no comparable previous attempt, expired member and failed request.
- Confirm priority/conflict behavior and that no recommendation contradicts readiness, available equipment, limitations or the established workout rules.
- Verify the five-second opening happens once per authenticated session, never for visitors, never on every route change, and does not collide with another open dialog.
- Inspect button placement and the complete window at desktop and phone widths, including long workout/exercise names and no horizontal overflow.
- Verify manual reopen, outside dismissal, close control and every recommendation link.
- Run the affected automated tests and confirm the preview build is clean.

## Scope boundary
This adds the Coach button and personal recommendation window only. It does not add chat, AI generation, new workout rules, email/inbox messages, or automatic workout creation.
