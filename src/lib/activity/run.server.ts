import type { SupabaseClient } from "@supabase/supabase-js";
import type { CronJobConfig } from "@/lib/cron/jobs.server";
import { addDaysISO, localDate } from "./report";
import { collectUserActivity } from "./collect.server";

export const DEFAULT_ACTIVITY_RECIPIENT = "smartygym@outlook.com";

export function activityRecipient(config?: CronJobConfig): string {
  const raw = config?.content?.recipient;
  return (typeof raw === "string" && raw.trim()) || DEFAULT_ACTIVITY_RECIPIENT;
}

/** Emails the previous Cyprus day's member activity. Same day = same email (deduped). */
export async function runUserActivityReport(
  db: SupabaseClient,
  opts: { config?: CronJobConfig; trigger: "schedule" | "manual"; now?: Date },
): Promise<{ status: "ok" | "failed"; summary: string; date: string }> {
  const date = addDaysISO(localDate(opts.now ?? new Date()), -1);
  const recipient = activityRecipient(opts.config);
  const report = await collectUserActivity(db, date, date);
  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
  await sendTemplateEmail("user-activity-report", recipient, {
    templateData: { report },
    idempotencyKey: opts.trigger === "schedule" ? `user-activity-${date}-${recipient}` : undefined,
  });
  return { status: "ok", date, summary: `Report for ${date} emailed to ${recipient}: ${report.totals.users} member(s), ${report.totals.events} activit${report.totals.events === 1 ? "y" : "ies"}.` };
}
