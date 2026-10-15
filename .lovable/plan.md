# One announcement per Smarty Workouts publish action

## Requested behavior
- Creating or editing a hidden workout sends nothing. Hiding workouts sends nothing.
- Each completed publish action sends **one combined email per eligible account and one inbox message per account**, whether it publishes 1, 3, 5 or 50 workouts. Existing email preferences and the announcement automation switch remain respected.
- Count only workouts actually changed from hidden to visible; already-visible and failed-check workouts are excluded. An action publishing nothing sends nothing.
- A single workout announcement names the workout and links to it.
- Multiple workouts in one category get a brief summary such as “50 new Muscle Building workouts added. Check them in Smarty Workouts → Muscle Building,” with **one category link**.
- Multiple categories get a brief count/category summary and **one Smarty Workouts link**, never a list of workout links.
- Separate publish actions generate separate announcements. Retrying the same action must not duplicate delivery. Hiding and later publishing again is a new publish action.

## Verified current behavior
- Single-workout Show calls the announcement sender; it currently deduplicates by workout ID.
- Show selected / Show all filtered currently send no announcements.
- Publish Checked Workouts currently calls a sender that loops through workouts, producing separate announcements.
- Inbox workout buttons currently derive a single-workout link from the notification deduplication key.
- Category pages exist, including `/smarty-workouts/category/muscle-building`; the collection page is `/smarty-workouts`.

## Changes
1. Make all Smarty publish paths use the same per-action announcement behavior, including individual Show, Show selected, Show all filtered and Publish Checked Workouts.
2. Assemble one announcement from the successfully published records, with matching email/inbox wording and destination. Remove the legacy-origin exclusion so all Smarty Workouts follow the same rule.
3. Update the inbox button to support the category and collection destinations while preserving older notifications.
4. Update publish confirmation messages to state the affected count and that this action sends one combined announcement per account. Preserve selected/filtered scope and the existing layout.
5. Report publication and announcement outcomes separately: published count, held count, inbox deliveries, email deliveries and any sending failure. Do not claim delivery when sending fails.

## Technical safeguards
- Keep the existing Resend broadcast delivery path, email branding, recipient preferences and delivery history; do not move bulk announcements to managed app emails.
- Use a stable publish-action identifier shared by email and inbox deduplication. Distinguish retried actions from new publish actions rather than deduplicating forever by workout ID or a hash of selected workouts alone.
- Collect changed IDs from conditional visibility updates, not merely requested IDs. If part of an operation succeeds before a failure, summarize only the successfully published subset and clearly report the partial result.
- Preserve the full compliance/publication gate on every publishing path; do not relax workout rules or change workout content, pictures, customer assets or Logbooks.
- Update the existing architecture rule and project requirement memory to replace the previous bulk-silent behavior after approval.

## Verification
- Test 1-workout, same-category multi-workout and mixed-category announcements, matching inbox/email destinations and counts.
- Test selection/filter scope, blocked records, already-visible records, hidden creation, hiding, zero changes, partial failures, repeat requests and separate publish actions.
- Test email opt-outs, legacy inbox links and removal of the origin exclusion.
- Run relevant tests, the full existing test suite and check the app's build result.
- Verify the admin confirmations and inbox destinations in the browser. Exercise publication/delivery with isolated test fixtures or intercepted sends, not the real 50 workouts; disclose that limitation. No real workouts will be published or customer emails sent merely to test this change.