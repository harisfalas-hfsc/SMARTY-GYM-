import { describe, expect, it } from "vitest";
import { CRON_JOB_BY_KEY, CRON_JOBS } from "@/lib/cron/registry";
import { checkinReminderHours } from "@/lib/checkin-reminders.server";

describe("cron job settings", () => {
  it("blog member email is its own job with its own editable time", () => {
    const job = CRON_JOB_BY_KEY["blog-email-broadcast"];
    expect(job.timeEditable).toBe(true);
    expect(job.channels).toEqual(["member-email"]);
    expect(job.defaults).toMatchObject({ hour: 10, minute: 0 });
    expect(CRON_JOB_BY_KEY["generate-weekly-blog-article"].channels).not.toContain("member-email");
  });

  it("every scheduled (non-instant) job that messages members has an editable time, except member-chosen motivation and 5-minute reminders", () => {
    const locked = CRON_JOBS.filter(
      (j) => !j.instant && j.timing !== "continuous" && !j.timeEditable,
    ).map((j) => j.key);
    expect(locked).toEqual(["daily-motivation"]);
  });

  it("check-in reminder hours stay inside their windows", () => {
    expect(checkinReminderHours(8, 20)).toEqual({ morning: 8, night: 20 });
    expect(checkinReminderHours(3, 23)).toEqual({ morning: 7, night: 21 });
    expect(checkinReminderHours(undefined, undefined)).toEqual({ morning: 8, night: 20 });
  });
});
