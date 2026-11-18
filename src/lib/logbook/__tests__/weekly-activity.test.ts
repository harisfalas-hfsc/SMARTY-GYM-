import { describe, expect, it } from "vitest";
import { completedDays, localGreeting, localWeek } from "../weekly-activity";

describe("mobile weekly activity", () => {
  const now = new Date(2026, 10, 18, 12, 51);
  it("shows seven days Monday through Sunday and identifies today", () => {
    const days = localWeek(now);
    expect(days.map(day => day.key)).toEqual(["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"]);
    expect(days.filter(day => day.today).map(day => day.key)).toEqual(["2026-11-18"]);
  });
  it("keeps Sunday in the preceding Monday-first week across a year boundary", () => {
    expect(localWeek(new Date(2027, 0, 3))[0]?.key).toBe("2026-12-28");
  });
  it("marks only actual current-week completions, deduplicating repeat sessions", () => {
    expect([...completedDays([new Date(2026, 10, 17, 9).toISOString(), new Date(2026, 10, 17, 11).toISOString(), new Date(2026, 10, 15).toISOString(), new Date(2026, 10, 19).toISOString(), null, "invalid"], now)]).toEqual(["2026-11-17"]);
  });
  it("uses the viewer's local time for greetings", () => {
    expect(localGreeting(new Date(2026, 10, 18, 8))).toBe("Good morning");
    expect(localGreeting(now)).toBe("Good afternoon");
    expect(localGreeting(new Date(2026, 10, 18, 19))).toBe("Good evening");
  });
});