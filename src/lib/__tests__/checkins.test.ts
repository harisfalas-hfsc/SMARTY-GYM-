import { describe, expect, it } from "vitest";
import { checkinDate, pendingCheckin, localClock, computeScores, windowStatus, completeStreaks } from "@/lib/checkins/score";
import { recommend } from "@/lib/coach-rules";

const base = {
  selectedStars: 3, category: null, format: null, confidence: "Established" as const,
  readiness: "Ready" as const, readinessReason: "", strengthLoad: "Low" as const,
  conditioningLoad: "Low" as const, overallLoad: "Low" as const, sessionsLast7: 2,
  consecutiveDays: 1, loggedSessions: 10, progressionReady: [], recentShortfalls: 0,
};

describe("smarty check-ins", () => {
  it("scores a complete day 0-100 with the old weights", () => {
    const s = computeScores({ morning_completed: true, night_completed: true, sleep_hours: 8, sleep_quality: 5,
      readiness_score: 10, soreness_rating: 0, mood_rating: 5, steps_bucket: 5, hydration_liters: 3, protein_level: 4, day_strain: 6 });
    expect(s["daily_smarty_score"]).toBe(100);
    expect(s["score_category"]).toBe("green");
    expect(s["status"]).toBe("complete");
  });
  it("morning only has no daily score", () => {
    const s = computeScores({ morning_completed: true, sleep_hours: 6, sleep_quality: 3, readiness_score: 5, soreness_rating: 3, mood_rating: 3 });
    expect(s["daily_smarty_score"]).toBeUndefined();
    expect(s["status"]).toBe("incomplete_morning_only");
  });
  it("morning remains available from 05:00 through 18:59", () => {
    expect(windowStatus(5 * 60).isMorning).toBe(true);
    expect(windowStatus(12 * 60).isMorning).toBe(true);
    expect(windowStatus(18 * 60 + 59).isMorning).toBe(true);
    expect(windowStatus(19 * 60).isMorning).toBe(false);
  });
  it("evening remains available from 19:00 through 04:59", () => {
    expect(windowStatus(19 * 60).isNight).toBe(true);
    expect(windowStatus(23 * 60 + 59).isNight).toBe(true);
    expect(windowStatus(0).isNight).toBe(true);
    expect(windowStatus(4 * 60 + 59).isNight).toBe(true);
    expect(windowStatus(5 * 60).isNight).toBe(false);
  });
  it("has exactly one active check-in at every minute", () => {
    for (let m = 0; m < 1440; m++) {
      const w = windowStatus(m);
      expect(Number(w.isMorning) + Number(w.isNight)).toBe(1);
    }
  });
  it("attributes an overnight evening save to the previous date, including year rollover", () => {
    expect(checkinDate("2026-11-22", 4 * 60 + 59)).toBe("2026-11-21");
    expect(checkinDate("2027-01-01", 0)).toBe("2026-12-31");
    expect(checkinDate("2026-11-22", 5 * 60)).toBe("2026-11-22");
  });
  it("uses the member timezone across the overnight boundary", () => {
    const clock = localClock(new Date("2026-11-21T22:30:00Z"), "Europe/Nicosia");
    expect(clock.date).toBe("2026-11-22");
    expect(checkinDate(clock.date, clock.minutes)).toBe("2026-11-21");
  });
  it("prompts only for an unanswered check-in in the active window", () => {
    expect(pendingCheckin(12 * 60, null)).toBe("morning");
    expect(pendingCheckin(12 * 60, { morning_completed: true })).toBeNull();
    expect(pendingCheckin(1 * 60, { morning_completed: true })).toBe("night");
    expect(pendingCheckin(1 * 60, { night_completed: true })).toBeNull();
  });
  it("streaks", () => {
    expect(completeStreaks(["2026-01-01", "2026-01-02", "2026-01-04"], "2026-01-04")).toEqual({ current: 1, longest: 2 });
  });
  it("poor check-in suggests 1 star with a because-reason", () => {
    const r = recommend({ ...base, checkin: { sleepHours: 5, sleepQuality: 2, readiness: 4, soreness: 8, mood: 3, yesterdayStrain: null, yesterdayScore: null } });
    expect(r.id).toBe("checkin.recover");
    expect(r.suggestedStars).toBe(1);
    expect(r.reason).toMatch(/^Because you slept 5 hours/);
  });
  it("no check-in leaves existing rules untouched", () => {
    expect(recommend({ ...base, checkin: null }).id).toBe("steady.ok");
  });
});
