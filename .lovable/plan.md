# Smarty Insights: weekly coach report in the Logbook, the app inbox, by email and as a PDF

## What members get

1. **A new "Insights" section** at the bottom of Logbook → Progress, after everything that's already there. It summarises the member's Workouts, Calendar and Progress in one place.
2. **A weekly report every Monday at 06:00 Cyprus time.** It goes to the app inbox and by email, and covers the past 7 days, Monday to Sunday.
3. **A PDF download** of the Insights, in the same portrait style as "Why Invest in SMARTYGYM?" and "The Smarty Method": white background, colours, graphs and icons.

## What Insights contains (all calculated from the member's own data, no AI)

- **Weekly snapshot:** colourful cards with emoji for workouts completed, active days, total training time, current and best streak, Smarty Progress Score and rank, and the change from last week (↑ / ↓).
- **What you did:** a breakdown by category (Strength, Cardio, Mobility, Recovery and others), a 7-day dot calendar, and highlights such as personal bests and badges earned.
- **What you didn't do:** workouts you scheduled but missed, and categories you haven't trained in 14 or more days.
- **Training Load:** the existing Training Load reading and trend graph, using the same formula. A link opens the Training Load science page.
- **Progress:** score trend, strength progress, and check-in averages for sleep, energy and stress, if the member uses check-ins.
- **Coming up:** the member's scheduled workouts for the next 7 days.
- **Smarty Coach suggestions:** 3 to 5 tips, each with a button that opens the right part of the app.

## Smarty Coach suggestion rules

These are fixed rules. The same week always gives the same tips.

| Situation | Suggestion | Button |
|---|---|---|
| More than 70% Strength or Muscle Building | Add cardio or metabolic work | Cardio category |
| No Mobility & Stability in 14 days | Don't forget mobility | Mobility category |
| 3 or more hard days in a row without Recovery | Add a recovery session | Recovery category |
| Training load rising sharply | Ease off this week | Training Load page |
| 0 workouts this week | Gentle restart: today's WOD | WOD |
| 5 or more workouts and nothing shared | Share one so others can train your way | Shared Workouts |
| Never used Create Your Own Workout | Build one with Smarty Coach | Create Your Own Workout |
| No check-ins this week | Do your daily check-in | Smarty Check-ins |
| Nothing scheduled next week | Plan your week | Calendar |
| Streak of 7 days or more | Keep the streak alive (motivation) | Smarty Ritual |

Every tip uses your existing coaching tone and stays within the "no internal details in copy" rule.

## Who receives the weekly report

- Every account with at least one completed workout ever, including expired and free members. This is what you asked for.
- Nobody gets a blank report. Members with nothing this week get a short motivational version ("Your week starts now"). Members with no history at all get nothing.
- **Expired members:** the email shows their snapshot, and its button invites them to come back. When they open the app, their history is still kept but stays locked, as it is now.
- **Visitors and free accounts** see a locked preview of the Insights section, matching how other Premium features work.

## Admin

- A new job, **"Weekly Insights report"**, appears in Admin Cron Jobs. It runs every Monday at 06:00 Cyprus time and has the usual on/off switch, history ("sent to N accounts, M emails") and problems list.
- **Account setting:** a new "Weekly Insights emails" switch sits under the two announcement switches. The in-app message always arrives and can't be turned off, the same as the other announcements.

## My suggestions (included in this plan)

- Compare every week with the previous one, so members can see they're improving.
- Give each week one "headline of the week", for example "Your strongest week yet 💪".
- Before the first send, send one sample report to you at harisfalas@gmail.com so you can check it.
- Point every email button to the Insights section in the Logbook, so the email and the app match.

## Technical details

- **Shared calculation:** a new `src/lib/insights/compute.ts` takes the existing progress, performance, check-in and schedule loaders and returns one `WeeklyInsights` object. The Insights section, the inbox message, the email and the PDF all use it, so they can't drift apart. The tips come from a pure rule function with tests.
- **Server:** `src/lib/insights.functions.ts` loads the signed-in member's own Insights.
- **Weekly send:**
  - It runs inside the existing `daily-run` scheduler as the job `weekly-insights`, at minute 0 of Monday 06:00 Europe/Nicosia, handling daylight-saving time correctly.
  - It sends in batches, one at a time, and keeps progress so a retry never sends twice. Each send uses the key `insights:{isoWeek}`.
  - Emails go through the Resend gateway, the same path as the announcements, and only email addresses with a working connection receive them.
- **Database migration:**
  - Add `profiles.email_weekly_insights`, on by default.
  - Reuse the existing tables for marking sends (`broadcast_email_sends`) and the inbox (`notifications`).
- **Email design:** the same layout as the announcement emails, with KPI tiles, a simple bar chart drawn as an email-safe table, the tips and buttons.
- **PDF:** the existing html2canvas-pro + jsPDF page export captures every visible block of the Insights section.
- **Checks:**
  - Unit tests for the calculation and tips.
  - A test send to you.
  - Desktop (1280px) and phone (384px) checks of the section, the email and the PDF.
  - Admin job visible.
  - The full test suite and the build.
