/**
 * Every automated (cron) job in SmartyGym, described in one place.
 *
 * The hourly scheduler (`/api/public/hooks/daily-run`, pg_cron, every 5 minutes)
 * is the only trigger. Each job below decides whether it is due, and the Admin
 * panel edits the switch / time / content stored in the `cron_jobs` table.
 */

export type CronJobKey =
  | "smarty-gift-reminders"
  | "daily-motivation"
  | "wod-selection"
  | "schedule-reminders"
  | "checkin-reminders"
  | "seo-refresh"
  | "health-check"
  | "error-alerts"
  | "premium-welcome"
  | "generate-weekly-blog-article"
  | "blog-email-broadcast"
  | "workout-recovery"
  | "new-workout-announcement"
  | "shared-workout-announcement"
  | "weekly-insights"
  | "user-activity-report";

export type CronTiming = "per-member" | "fixed" | "weekly" | "continuous";

/** What a job communicates. "system" = internal processing only. */
export type CronChannel = "member-email" | "admin-email" | "in-app" | "system";

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
  /** Who/what the job sends to. In-app notifications always fire when the job runs. */
  channels: CronChannel[];
  /** Event jobs fire the moment something happens (publish, share, payment). */
  instant?: boolean;
  /** Whether the admin can change the hour/minute. */
  timeEditable: boolean;
  /** Per-member hourly jobs: only the hour is used (sent on the first check of that hour). */
  hourOnly?: boolean;
  /** Whether the job has editable content (message pool, extra keywords, ...). */
  contentEditable: boolean;
  contentLabel?: string;
  contentHelp?: string;
  /** Extra settings the admin panel renders for this job. */
  settings?: ("recipient" | "checks" | "severity" | "groupWindow" | "nightHour")[];
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
    key: "smarty-gift-reminders", label: "Smarty Gift reminders",
    description: "Reminds recipients about their unclaimed gift after three days, then every seven days. Gifts never expire before activation. Claiming or choosing Stop gift reminders ends reminders. Existing accounts also receive a matching inbox message.",
    timing: "fixed", timingNote: "Daily at the time below in Cyprus. Checks only gifts whose reminder is due; default 10:05. Failed deliveries retry on the next check.",
    sends: [{ title: "Your Smarty Gift is waiting for you", body: "Same gift picture, sender name, personal message and Claim Your Gift button. Reminder email uses Resend and includes Stop gift reminders." }],
    channels: ["member-email","in-app"], timeEditable: true, contentEditable: true, contentLabel: "Gift invitation and reminder introduction",
    contentHelp: "Plain text shown above the sender’s personal message. Leave empty for the standard introduction. The gift picture, personal greeting and activation terms remain unchanged.",
    runnable: true, defaults: { enabled: true, hour: 10, minute: 5 },
  },
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
    channels: ["in-app"], timeEditable: false,
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
    channels: ["system"], timeEditable: true,
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
    channels: ["in-app"], timeEditable: false,
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
      "Sent at each member's local time. Morning reminder at the hour below (inside the 07:00–10:00 window, default 08:00); night reminder at the night hour below (inside 19:00–22:00, default 20:00). Notifications go out at the job time.",
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
    channels: ["in-app"], timeEditable: true, hourOnly: true, settings: ["nightHour"],
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
    channels: ["admin-email"], timeEditable: true,
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
    channels: ["admin-email"], timeEditable: true,
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
    channels: ["admin-email"], instant: true, timeEditable: false,
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
    channels: ["member-email","in-app"], instant: true, timeEditable: false,
    contentEditable: false,
    defaults: { enabled: true, hour: 0, minute: 0 },
  },
  {
    key: "generate-weekly-blog-article",
    label: "Weekly blog article",
    description:
      "Writes and publishes one brand-new Fitness article on the Blog every week, in the SmartyGym voice, with an SEO title, summary and internal links to real pages only. Titles used in the last 90 days are never repeated, and if an article was already published this week the job stops without posting a second one.",
    timing: "weekly",
    timingNote: "Creation: once a week, on Sunday at the time set below (Cyprus time). The inbox notification and your admin report go out at this time. Member emails are sent by the separate “Blog article member email” job at its own time.",
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
    channels: ["in-app","admin-email"], timeEditable: true,
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
    key: "blog-email-broadcast",
    label: "Blog article member email",
    description:
      "Emails every member who keeps New article emails on about each blog article published in the last 8 days. Separate from article creation, so you choose when members receive the email. Each member receives each article once; already-emailed members are never emailed again.",
    timing: "weekly",
    timingNote:
      "Once a week, on Sunday at the time set below (Cyprus time) — 10:00 by default. Set it later than the article creation time so the new article is included.",
    sends: [
      { title: "New article: <title>", body: "Article title, summary and a Read article button — to members with New article emails on." },
    ],
    channels: ["member-email"], timeEditable: true,
    contentEditable: false,
    runnable: true,
    weekday: 0,
    defaults: { enabled: true, hour: 10, minute: 0 },
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
    channels: ["system"], timeEditable: false,
    contentEditable: false,
    defaults: { enabled: true, hour: 0, minute: 0 },
  },
  {
    key: "new-workout-announcement",
    label: "New workout announcement",
    description:
      "Each Smarty Workouts publish action sends one combined app notification per account and one matching email per opted-in account, covering only workouts changed from hidden to visible. One workout links to itself; multiple workouts in one category link to that category; mixed categories link to Smarty Workouts. Creating hidden workouts and hiding workouts send nothing. Retrying the same publish action does not duplicate announcements.",
    timing: "continuous",
    timingNote:
      "Sent when a publish action finishes. Each action has its own history entry with published count, inbox messages, emails accepted for sending and failures.",
    sends: [
      {
        title: "New Workout Added!",
        body: "One new workout or a brief combined count/category summary, with one workout, category or Smarty Workouts link — identical content and destination in app and email.",
      },
    ],
    channels: ["member-email","in-app"], instant: true, timeEditable: false,
    contentEditable: false,
    defaults: { enabled: true, hour: 0, minute: 0 },
  },
  {
    key: "shared-workout-announcement",
    label: "Shared workout announcement",
    description:
      "Every time a member shares a workout, every other account (Premium and free) gets an app notification with the workout name, creator and a View Workout button. A matching email is sent unless the member switched off shared-workout emails in My Account. One of seven wordings uses the sharer's first name. The sharer gets nothing, and sharing the same workout again never repeats it.",
    timing: "continuous",
    timingNote:
      "Event-triggered, not time-scheduled: sent the moment the workout is shared. A history line is written for each announcement.",
    sends: [
      { title: "New Shared Workout!", body: "Haris just shared a workout. Feeling in the mood to do it? • Workout name • Created by HARIS FALAS. • View Workout — identical content in app and email; never sent to the sharer." },
    ],
    channels: ["member-email","in-app"], instant: true, timeEditable: false,
    contentEditable: false,
    defaults: { enabled: true, hour: 0, minute: 0 },
  },
  {
    key: "weekly-insights",
    label: "Weekly Insights report",
    description:
      "Every Monday morning, every account with at least one completed workout (Premium, expired or free) gets its personal weekly Smarty Insights: workouts, active days, training time, streak, score, Training Load, check-ins, what is coming up and Smarty Coach suggestions with links. Delivered to the app inbox and by email, unless the member switched off Weekly Insights emails in My Account. Never sent twice for the same week.",
    timing: "per-member",
    timingNote: "Every Monday from the hour below (default 06:00) in each member's own timezone. Inbox message and email are delivered together. Anything not yet delivered (for example after an email failure) is retried every hour until Sunday, never twice.",
    sends: [
      { title: "Your weekly Insights are ready", body: "Inbox summary of the week plus the first Smarty Coach tip, and a full colourful email report with an Open my Insights button. Full details in Logbook → Progress → Insights." },
    ],
    channels: ["member-email","in-app"], timeEditable: true, hourOnly: true,
    contentEditable: false,
    defaults: { enabled: true, hour: 6, minute: 0 },
  },
  {
    key: "user-activity-report",
    label: "Daily user activity report",
    description:
      "Emails you one report of everything members did the previous day (Cyprus time), grouped by member: account created, subscribed, membership ending, workouts created, added, scheduled, completed, shared and favorited, likes, ratings, comments, check-ins, badges, feedback and messages — each with its date and time. The same report, for any dates, is in Admin → User activity with PDF and CSV download.",
    timing: "fixed",
    timingNote:
      "Runs once a day at the exact time set below (Cyprus time) — 00:30 by default — and always covers the whole previous day. Changing the time takes effect the same day; it is never sent twice for the same day.",
    sends: [
      { title: "User activity 2026-10-09 — 10 members, 62 activities", body: "One card per member with their details and a timed list of everything they did." },
    ],
    channels: ["admin-email"], timeEditable: true,
    contentEditable: false,
    settings: ["recipient"],
    runnable: true,
    defaults: { enabled: true, hour: 0, minute: 30 },
  },
];

export const CRON_JOB_BY_KEY: Record<string, CronJobDefinition> = Object.fromEntries(
  CRON_JOBS.map((j) => [j.key, j]),
) as Record<string, CronJobDefinition>;
