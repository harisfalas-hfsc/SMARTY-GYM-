/** Every check the nightly health report can run. Client-safe (used by the admin panel). */
export const HEALTH_CHECKS: { key: string; label: string }[] = [
  { key: "database", label: "Database reachable" },
  { key: "tables", label: "Key tables readable" },
  { key: "library", label: "Exercise library health" },
  { key: "media", label: "Exercise media storage (player images)" },
  { key: "ai", label: "Workout generation availability" },
  { key: "wod", label: "Workout of the Day" },
  { key: "email", label: "Email delivery" },
  { key: "jobs", label: "Scheduled jobs (failed / switched off)" },
  { key: "overdue", label: "Scheduled jobs running on time" },
  { key: "generation", label: "Workout generation failures (members)" },
  { key: "payments", label: "Payments and subscriptions" },
  { key: "ritual", label: "Smarty Ritual" },
  { key: "features", label: "Community, Shared Workouts, Blog, Exercise Library" },
  { key: "pages", label: "Public pages reachable" },
  { key: "sharing", label: "Shared workout links" },
  { key: "blogimages", label: "Blog cover images" },
  { key: "memberdata", label: "Logbook / progress / player data" },
  { key: "support", label: "Support inbox" },
  { key: "errors", label: "Member errors in the last 24 hours (by feature)" },
  { key: "activity", label: "Activity in the last 24 hours" },
];

export const DEFAULT_HEALTH_RECIPIENT = "smartygym@outlook.com";
