import { describe, expect, it } from "vitest";
import { computeScores, windowStatus, completeStreaks } from "@/lib/checkins/score";
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
  it("windows are 07-10 and 19-22", () => {
    expect(windowStatus(7 * 60).isMorning).toBe(true);
    expect(windowStatus(10 * 60).isMorning).toBe(false);
    expect(windowStatus(21 * 60 + 59).isNight).toBe(true);
    expect(windowStatus(12 * 60).next).toBe("night");
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
