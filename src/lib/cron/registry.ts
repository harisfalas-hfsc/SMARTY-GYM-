/**
 * Every automated (cron) job in SmartyGym, described in one place.
 *
 * The hourly scheduler (`/api/public/hooks/daily-run`, pg_cron, every 5 minutes)
 * is the only trigger. Each job below decides whether it is due, and the Admin
 * panel edits the switch / time / content stored in the `cron_jobs` table.
 */

export type CronJobKey =
  | "daily-motivation"
  | "wod-selection"
  | "schedule-reminders"
  | "checkin-reminders"
  | "seo-refresh"
  | "health-check"
  | "error-alerts"
  | "premium-welcome"
  | "generate-weekly-blog-article"
  | "workout-recovery";

export type CronTiming = "per-member" | "fixed" | "weekly" | "continuous";

export interface CronJobDefinition {
  key: CronJobKey;
  label: string;
  /** What the job does, in plain language. */
  description: string;
  /** How its run time is decided. */
  timing: CronTiming;
  timingNote: string;
  /** Exactly what the member (or the admin) receives. */
  sends: { title: string; body: string }[];
  /** Whether the admin can change the hour/minute. */
  timeEditable: boolean;
  /** Whether the job has editable content (message pool, extra keywords, ...). */
  contentEditable: boolean;
  contentLabel?: string;
  contentHelp?: string;
  /** Extra settings the admin panel renders for this job. */
  settings?: ("recipient" | "checks" | "severity" | "groupWindow")[];
  /** Whether the job can be triggered on demand from the admin panel. */
  runnable?: boolean;
  /** Weekly jobs only: day of week, 0 = Sunday. */
  weekday?: number;
  defaults: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
}

export const CRON_JOBS: CronJobDefinition[] = [
  {
    key: "daily-motivation",
    label: "Daily motivation message",
    description:
      "Posts one motivational notification to every member who has daily motivation switched on. Deterministic per member and per day, so nobody gets the same line twice in a row and nobody gets two in one day.",
    timing: "per-member",
    timingNote:
      "Sent at each member's own local hour (their Training Profile setting, 07:00 by default). The global switch below turns it on or off for everyone.",
    sends: [
      {
        title: "Good morning from Smarty Coach",
        body: "One line from the message pool below — for example: “Show up today. The plan does the rest.”",
      },
      {
        title: "5-day streak alive — keep it going.",
        body: "Members on a streak of 2+ completed days get the streak headline instead.",
      },
    ],
    timeEditable: false,
    contentEditable: true,
    contentLabel: "Motivation message pool",
    contentHelp:
      "One message per line. A member gets the same line for a whole day. Leave empty to use the built-in pool.",
    defaults: { enabled: false, hour: 7, minute: 0 },
  },
  {
    key: "wod-selection",
    label: "Workout of the Day selection",
    description:
      "Every night at midnight (Cyprus time) reads the 84-day periodization and picks the shared Workout of the Day from your Smarty Workouts: one bodyweight and one equipment workout matching the day's category, level and strength focus (one Recovery workout on Recovery days). A workout is not repeated until every other matching workout has been used. It also prepares tomorrow in advance, and every hourly check fills any empty slot so the page is never empty. Admin overrides are never replaced.",
    timing: "fixed",
    timingNote:
      "Runs once a day at 00:00 Cyprus time (the hourly scheduler fires at :05). Admin overrides and swaps in Admin → Workout of the Day are kept.",
    sends: [
      {
        title: "Workout of the Day page",
        body: "Today's two cards (bodyweight + equipment), or one Recovery card, visible to everyone; opening them needs Premium.",
      },
    ],
    timeEditable: true,
    contentEditable: false,
    runnable: true,
    defaults: { enabled: true, hour: 0, minute: 0 },
  },
  {
    key: "schedule-reminders",
    label: "Scheduled workout reminders",
    description:
      "Reminds members about workouts they scheduled in the Logbook: 30 minutes before, at the scheduled time, and a follow-up the next day when the session was never completed.",
    timing: "continuous",
    timingNote:
      "Checked every 5 minutes, because each member schedules at a different time. Every reminder is deduplicated, so nobody is reminded twice.",
    sends: [
      { title: "Your workout starts in 30 minutes", body: "CATEGORY — workout name." },
      { title: "Time to train", body: "CATEGORY — workout name." },
      {
        title: "Did you train yesterday?",
        body: "Mark it done, or reschedule it in your Logbook.",
      },
    ],
    timeEditable: false,
    contentEditable: false,
    defaults: { enabled: false, hour: 0, minute: 0 },
  },
  {
    key: "checkin-reminders",
    label: "Smarty Check-in reminders",
    description:
      "Sends one inbox message to every Premium member for each check-in window they have not completed yet — once in the morning and once at night. Members who already checked in get nothing, and nobody gets the same reminder twice in a day.",
    timing: "per-member",
    timingNote:
      "Sent inside each window at the member's local time: 08:05 (morning window 07:00–10:00) and 20:05 (night window 19:00–22:00).",
    sends: [
      {
        title: "Your Morning Smarty Check-in is open",
        body: "Takes 30 seconds. Open until 10:00 — with a Do check-in button.",
      },
      {
        title: "Your Night Smarty Check-in is open",
        body: "Review your day in 30 seconds. Open until 22:00.",
      },
    ],
    timeEditable: false,
    contentEditable: false,
    defaults: { enabled: true, hour: 8, minute: 0 },
  },
  {
    key: "seo-refresh",
    label: "Automatic SEO update",
    description:
      "Rebuilds the internal SEO index from public pages, training topics, active library exercises, published articles and publicly accessible shared workouts only. Stale terms are removed. Emails the administrator a status report; Google indexing requires separate Search Console review.",
    timing: "weekly",
    timingNote:
      "Runs once a week, on Sunday night at the time set below (Cyprus time) — 23:00 by default, so it finishes before Monday. Background only: nothing visible on the site changes.",
    sends: [
      {
        title: "[Admin] SEO update — X new keywords",
        body: "Email to smartygym@outlook.com with the run time, what was updated, the new keywords and anything that failed.",
      },
    ],
    timeEditable: true,
    contentEditable: true,
    contentLabel: "Extra keywords to always include",
    contentHelp:
      "One relevant phrase per line. The current list replaces stale phrases on the next run; it is never published verbatim.",
    weekday: 0,
    defaults: { enabled: true, hour: 23, minute: 0 },
    runnable: true,
  },
  {
    key: "health-check",
    label: "Daily system health audit",
    description:
      "Audits the whole system once a day — database, exercise library, player media, workout generation (including failed or stuck requests), Workout of the Day, payments (switch, failed or past-due subscriptions, payment errors), every scheduled job (failed, switched off or overdue), all public pages, Smarty Ritual, Community, Shared Workouts, Blog, share links, logbook / progress / player data, the support inbox, member errors from the last 24 hours and the day's activity. A numbered report is emailed every day, pass or fail. You can also run it any time from System health.",
    timing: "fixed",
    timingNote:
      "Runs once a day at the time set below (Cyprus time). Default 12:00. The report is always emailed, so silence means the check itself did not run.",
    sends: [
      {
        title: "[Health] All checks passed",
        body: "Numbered report with PASS / WARNING / FAILED and one line of detail per check.",
      },
      {
        title: "[Health] 1 FAILURE(S) — 20/21 checks passed",
        body: "Same report, headline naming the failures — for example “WORKOUT GENERATION UNAVAILABLE — members cannot generate workouts”.",
      },
    ],
    timeEditable: true,
    contentEditable: false,
    settings: ["recipient", "checks"],
    runnable: true,
    defaults: { enabled: false, hour: 12, minute: 0 },
  },
  {
    key: "error-alerts",
    label: "Instant problem alerts",
    description:
      "Emails you the moment something actually breaks for a member — a workout that will not generate, a Workout of the Day that fails, a logbook, progress, player, sharing, payment or messaging error, or an app crash on a member's device. Every alert names the problem, the exact time and the member affected. Repeats of the same problem are counted instead of re-sent.",
    timing: "continuous",
    timingNote:
      "Not scheduled — sent immediately when a problem is recorded. The switch below turns the emails on or off; problems are always logged either way.",
    sends: [
      {
        title: "[Problem] workout generation unavailable",
        body: "What broke, where, the exact Cyprus time, the member affected and the technical details.",
      },
    ],
    timeEditable: false,
    contentEditable: false,
    settings: ["recipient", "severity", "groupWindow"],
    defaults: { enabled: false, hour: 0, minute: 0 },
  },
  {
    key: "premium-welcome",
    label: "First Premium welcome",
    description:
      "Sends the branded Welcome onboard email and matching inbox guide once, immediately after a member's first successful Premium activation. Renewals and payment retries never send it again.",
    timing: "continuous",
    timingNote:
      "Event-triggered, not time-scheduled. Stripe starts it immediately when the first Premium payment activates the membership; it is listed here so its automation is visible and auditable.",
    sends: [
      {
        title: "Welcome onboard, member name!",
        body: "One branded email and one inbox guide covering Smarty Workouts, Workout of the Day, Create Your Own Workout, Training Tools, Blog, Smarty Check-ins and Smarty Ritual.",
      },
    ],
    timeEditable: false,
    contentEditable: false,
    defaults: { enabled: true, hour: 0, minute: 0 },
  },
  {
    key: "generate-weekly-blog-article",
    label: "Weekly blog article",
    description:
      "Writes and publishes one brand-new Fitness article on the Blog every week, in the SmartyGym voice, with an SEO title, summary and internal links to real pages only. Titles used in the last 90 days are never repeated, and if an article was already published this week the job stops without posting a second one.",
    timing: "weekly",
    timingNote: "Runs once a week, on Sunday at the time set below (site timezone).",
    sends: [
      {
        title: "New Fitness article published on /blog",
        body: "The article goes live immediately with a custom cover image, bylined Haris Falas, Sports Scientist, CSCS certified. If the cover image cannot be created, nothing is published — no article ever goes live without a picture.",
      },
      {
        title: "Admin report email",
        body: "Every published article is emailed to the admin address below with its title, what it is about, read time and how many members were notified.",
      },
      {
        title: "Inbox notification for every member",
        body: "“New article: <title>” lands in each member's inbox with a Read article link straight to the new post.",
      },
    ],
    timeEditable: true,
    contentEditable: true,
    contentLabel: "Extra topics to write about",
    contentHelp:
      "One topic per line. These are added to the built-in topic rotation. Leave empty to use the built-in list only.",
    settings: ["recipient"],
    runnable: true,
    weekday: 0,
    defaults: { enabled: false, hour: 0, minute: 0 },
  },
  {
    key: "workout-recovery",
    label: "Workout creation recovery",
    description:
      "Finishes any workout (including the Workout of the Day) whose creation failed halfway, and alerts you once about any creation that has stayed unfinished for 20 hours. Nothing is ever deleted from a member's history.",
    timing: "continuous",
    timingNote:
      "Checks every 5 minutes. A history line is written whenever something was recovered or reported, plus one daily check-in line.",
    sends: [
      {
        title: "Nothing sent to members",
        body: "The rebuilt workout simply appears where the member expects it.",
      },
    ],
    timeEditable: false,
    contentEditable: false,
    defaults: { enabled: true, hour: 0, minute: 0 },
  },
];

export const CRON_JOB_BY_KEY: Record<string, CronJobDefinition> = Object.fromEntries(
  CRON_JOBS.map((j) => [j.key, j]),
) as Record<string, CronJobDefinition>;
