# Smarty Insights: compliance check against the 7 requirements, and fixes

## Results of the check

| # | Requirement | Result | What's wrong today |
|---|---|---|---|
| 1 | Reporting period | Fails | The report uses each member's own timezone, not Europe/Nicosia. The weekly send key uses "Europe/Athens". In the app, the default view is "This week" instead of the week just finished. |
| 2 | No duplicates, no one skipped | Fails | Inbox messages and emails are each recorded only once, so neither can be sent twice. But the inbox message is saved before the email is sent. If the email then fails, the retry sees the inbox message and skips that member, so the email is lost. If the run crashes after recording an email but before sending it, that member is skipped for good. Nothing tells the email provider to ignore a repeated send. |
| 3 | PDF quality | Fails | The PDF is a screenshot of the on-screen section. It isn't a dedicated layout built from the shared weekly data, and on phones it depends on how the screen looks. |
| 4 | Coaching rules | Partly | The tips are already deterministic and avoid dividing by zero. But priorities aren't explicit, a week can end up with only 2 tips, and nothing prevents two tips that conflict. |
| 5 | Data accuracy | Fails | **Training Load:** it adds up stored session numbers instead of using the existing Training Load calculation. **Missed workouts:** it counts a workout as missed if it isn't completed, even when its status doesn't show it was scheduled. **Missing data:** if a member has no saved progress, it shows 0 instead of "no data". **Training time:** it uses the planned workout length, without saying so. |
| 6 | Delivery preferences | Passes, not tested end to end | **Passes in the code:** the weekly email switch is respected and the inbox message always arrives. Expired members get the inbox message and email, and the Insights page stays locked for them. **Not done yet:** a real test as an expired member. |
| 7 | Acceptance tests | Fails | **Done:** 4 unit checks on the tip rules, one sample email to you, and screenshots on desktop and phone. **Missing:** none of the 8 scenarios has been tested. |

## Fixes (only what fails; no new features, no changes to existing calculations)

1. **Reporting period**
   - Every weekly boundary will use the Monday-to-Sunday week just before the report, in "Europe/Nicosia". Members' own timezones won't be used.
   - Daylight saving will be handled through real Nicosia calendar dates, so the change-over weeks are covered correctly.
   - The Monday job and its send key will use Europe/Nicosia.
   - The app will open on "Last week" (the reported week). "This week so far" stays available as a second option.
2. **No duplicates, no one skipped**
   - The inbox message and the email will be tracked separately. Inbox uses key `insights-inbox:{week}`, and email uses key `insights-email:{week}` per member.
   - A retry will pick up anyone still missing either the inbox message or the email.
   - Each send will carry the provider's "ignore repeats" key, based on member and week. A member is recorded as "sending" before the email goes out, and as "sent" only after the provider accepts it. Anyone left at "sending" is sent again with the same key, so a crash can't cause a duplicate or a lost email.
   - The job is marked done only when nobody is left.
3. **PDF quality:** build a dedicated A4 PDF from the weekly data itself, not from the screen. It will use the same brand style as the Progress PDF, with:
   - header, footer and page numbers
   - the snapshot cards
   - a 7-day bar chart
   - categories, and a "not completed" list
   - Training Load with the 5-week chart
   - check-ins and what's coming up
   - all the tips

   Text wraps and moves to a new page cleanly. It looks the same whether downloaded on a phone or a computer.
4. **Coaching rules**
   - Write down a fixed priority order:
     1. Safety: recovery or load warnings
     2. Restart (only for a week with no workouts)
     3. Balance: cardio or mobility
     4. Habits: plan, check-ins
     5. Growth: create, share, streak
     6. Explore
   - Clear limits for each rule:
     - Strength counts as most of the week above 70%, and only with 2 or more workouts.
     - "Hard days in a row" means 3 or more days.
     - Sharing needs 5 or more workouts.
     - The load warning only shows when Training Load itself says the load is high.
   - Rules that conflict: a week with no workouts never gets load, share or streak tips. The recovery tip replaces "add more" balance tips in the same week.
   - Always 3 to 5 tips, using fixed filler tips in order. Unit tests will cover each rule.
5. **Data accuracy**
   - **Training Load:** use the existing Training Load calculation (`summarizeStrength`, `summarizeConditioning`, `overallLoadState`), limited to the reported week. Show "not enough data" where Training Load does.
   - **Categories:** use the real Smarty category list.
   - **Not completed:** only workouts with status "scheduled" whose date has passed. These are labelled "Scheduled, not completed", never "missed". Any other status is left out.
   - **Missing data:** shown as "—" with "no data yet", never as 0.
   - **Training time:** labelled "Planned training time".
6. **Delivery preferences:** no code change. This gets tested as part of step 7.
7. **Acceptance tests:** a test file plus a staging run with fake members only. These are real database rows marked as test data, sent only to your address, and removed afterwards. The fake members:
   - a new account with no history (gets nothing)
   - a member with no workouts this week (restart report)
   - an active member
   - an expired member (gets the report, but Insights and workouts stay locked)
   - several eligible members together
   - a member with the email switch off (inbox message only)
   - a scheduler retry after a failure, run twice (no duplicates, nobody skipped)
   - the daylight-saving weeks at the end of March and the end of October

   I'll check the result in the inbox, the email (desktop and phone), the PDF (every page) and Admin Cron Jobs, then report which checks passed and which failed.

## Technical details

- **Week boundaries:**
  - `compute.ts` gets `reportWeek(now)` → Monday and Sunday dates in Europe/Nicosia.
  - Timestamps are converted with `localDateISO(.., "Europe/Nicosia")`.
  - `isDueNow` for `weekly-insights` uses the job's timezone, which will be Europe/Nicosia.
- **Delivery tracking:** `broadcast_email_sends` gets a nullable `state` column ('sending' | 'sent'), defaulting to 'sent' so existing rows are unaffected.
  - Resend calls send the `Idempotency-Key: insights-email:{user}:{week}` header.
  - The inbox insert uses `onConflict(user_id,dedupe_key) ignore`; there is already a unique index for this.
- **PDF:** a new `src/lib/insights/insights-pdf.ts` (jsPDF), in the same style as `progress-export.ts`. The section's `data-pdf-block` capture is removed.
- **Training Load:** `loadWeeklyInsights` reads `set_logs` and `workout_results` for the week and the 21 days before it, and calls the existing `src/lib/performance/load.ts` functions without changing them.
