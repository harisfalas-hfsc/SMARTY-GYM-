import { describe, expect, it } from "vitest";
import { isDueNow, type CronJobConfig } from "@/lib/cron/jobs.server";

const base = (p: Partial<CronJobConfig>): CronJobConfig => ({
  key: "smarty-gift-reminders",
  enabled: true,
  hour: 10,
  minute: 5,
  timezone: "Europe/Athens",
  content: {},
  last_run_on: null,
  updated_at: null,
  ...p,
});

// Monday 2 Nov 2026, Cyprus = UTC+2
const at = (cyprusHHMM: string, day = "2026-11-02") => {
  const [h, m] = cyprusHHMM.split(":").map(Number);
  return new Date(`${day}T${String(h - 2).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);
};

describe("admin-edited cron times", () => {
  it("runs at the edited time, not the old one", () => {
    const edited = base({ hour: 14, minute: 30 });
    expect(isDueNow(edited, at("10:05"))).toBe(false);
    expect(isDueNow(edited, at("14:25"))).toBe(false);
    expect(isDueNow(edited, at("14:30"))).toBe(true);
  });
  it("never runs twice the same day", () => {
    expect(isDueNow(base({ last_run_on: "2026-11-02" }), at("12:00"))).toBe(false);
  });
  it("switched-off job never runs", () => {
    expect(isDueNow(base({ enabled: false }), at("12:00"))).toBe(false);
  });
  it("weekly job only runs on its weekday (Sunday)", () => {
    const blog = base({ key: "blog-email-broadcast", hour: 10, minute: 0 });
    expect(isDueNow(blog, at("10:00", "2026-11-02"))).toBe(false);
    expect(isDueNow(blog, at("10:00", "2026-11-08"))).toBe(true);
  });
});
