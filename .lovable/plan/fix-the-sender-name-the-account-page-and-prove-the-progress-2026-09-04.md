# Fix the sender name, the account page and prove the progress graphs work

## 1. Emails must come from Smarty Gym, not Smarty Diet

You are right, and this needs correcting.

- Your workspace has four sending addresses. `smartygym.com` is the one this project should use, but it is still stuck at "setup failed", so it cannot send. The one that is verified and was picked up instead belongs to your diet project — that is why the last message said `notify.smartydiet.com`. No email has been sent from it.
- Put the project back on `notify.smartygym.com` everywhere (sign-up and confirmation emails, contact notifications, payment notices, nightly reports).
- Then re-run the Smarty Gym sending setup so it verifies. The usual cause of "setup failed" is that the two records Lovable gives you were not added at your domain provider; I will open the setup panel and tell you exactly which records to add, then re-check until it is verified.
- Until Smarty Gym is verified, emails will not go out at all — that is honest and safe; nothing will silently go out under the wrong brand.

## 2. My account — every button checked and fixed

Verified against the Smarty Workout project, screen by screen:

- **Workout of the Day → "See plans"**: confirmed broken. It points at the sign-in screen, which sends an already signed-in member straight back to the homepage. It will point at the pricing page (and disappear when payments are switched off), exactly like Smarty Workout.
- **Missing Subscription card**: Smarty Workout shows a Subscription card with your membership state, the renewal date, how many coach workouts you have left today, and Cancel / Resume membership. In this project that whole card was dropped during the copy — the daily allowance is even fetched and then never shown. It will be restored in the same shape, sitting alongside the newer "Manage my membership" card (card update, invoices, restart), with no duplication and hidden when payments are off.
- **Daily coaching**: check that the morning-message switch, its hour, the "have it ready by" hour, the time zone and Save all persist, reload correctly, and that the chosen hour is what the daily job actually uses.
- **Workout of the Day subscribe / unsubscribe**: check both directions really change your account, that a non-member is refused with a clear message, and that turning it on stops manual generation and turning it off restores it — same rules as Smarty Workout.
- **Contact support**: check the button reaches the contact page and a sent message lands in the admin Messages section and in the system mailbox.
- **Manage my membership**: check the status wording for active, ending, and failed payment, and that the billing portal opens and returns to the account page.
- **Delete account**: check the DELETE confirmation, that any live membership is cancelled first so nobody is charged after leaving, and restore Smarty Workout's safety net that alerts the owner if a cancellation could not be completed.

## 3. Logbook — list, calendar and progress

- Check the three views (list, calendar, progress) all load, and that the calendar shows the right sessions on the right days, moves between months, and opens a day.
- Check filters (all, completed, not completed, favourites, scheduled) and the per-session details, results and debrief.
- Confirm the trend chart shown under the calendar period behaves like Smarty Workout's.

## 4. Progress — the graphs you cannot see

Already checked, and this is the answer: the graph code in this project is **byte-for-byte identical** to Smarty Workout — the three load cards, the "Last 10 sessions" graph with its Strength load / Conditioning load / RPE / Session minutes selector, and the period trend chart. Nothing was left out.

They are blank because this project's database has **zero recorded sessions** (and zero completed workouts) — the graphs only draw once at least two finished sessions carry the same measurement. Smarty Workout has years of your sessions behind it; this copy started empty, the same as the blog and the exercise library did.

So the work here is proof, not repair:

- Complete real sessions in this project (or temporarily add a few recorded sessions to a test account) and confirm the three load cards fill in, the Last 10 sessions graph draws, the metric selector switches between strength, conditioning, RPE and minutes, and the numbers match what was entered.
- Confirm streak, longest streak, completed, generated, not completed, training days and awards all count correctly from the same sessions.
- Remove any test data afterwards so your own numbers stay honest.
- Report the comparison plainly: what the old project shows with data versus what this one shows with the same data.

## 5. Verification before I report back

- Walk the whole flow in a real browser: account page, every button above, logbook views, progress with data.
- Typecheck, build and tests must pass, with no errors in the browser console.
- Report each item as working, fixed, or data-dependent — no item skipped.

## Technical notes

- Sender: revert `SENDER_DOMAIN` / `FROM_DOMAIN` in `src/lib/email-templates/send-email.ts` and `src/routes/lovable/email/auth/webhook.ts` to `notify.smartygym.com`; re-run domain setup for `smartygym.com` (currently `provisioning_failed`).
- `src/components/DailyCoachingSettings.tsx`: `to="/auth"` → `to="/pricing"`, gated by `useFreeAccessMode`.
- `src/routes/_authenticated/account.tsx`: reinstate the Subscription card (premium state, `quota` used/limit, `setMembershipCancellation` cancel/resume) from the Smarty Workout version, kept compatible with `getMyMembership` and `MembershipCheckoutDialog`.
- `src/lib/account.functions.ts`: re-add the `notifyAdmins` fallback when a subscription cancellation fails during deletion.
- Progress/load code (`ProgressSection`, `TrainingLoadPanel`, `RecentLoadTrend`, `MetricLineChart`, `PeriodTrendChart`, `performance.functions.ts`, `progress.server.ts`) is confirmed identical to the source project — verification only; `workout_results` currently has 0 rows.
