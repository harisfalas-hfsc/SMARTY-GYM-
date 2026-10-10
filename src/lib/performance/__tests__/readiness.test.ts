import { describe, it, expect } from "vitest";
import { liveReadiness, type ReadinessSession } from "../readiness";

const now = new Date("2026-10-10T20:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
const session = (h: number, over: Partial<ReadinessSession> = {}): ReadinessSession => ({
  name: "Iron Builder", completedAt: hoursAgo(h), durationMin: 45, rpe: 8, difficultyStars: 2, category: "STRENGTH", ...over,
});
const run = (sessions: ReadinessSession[], checkin: Parameters<typeof liveReadiness>[0]["checkin"] = null, consecutiveDays = 0) =>
  liveReadiness({ now, sessions, checkin, consecutiveDays });

describe("live readiness", () => {
  it("is fully ready with no training and no check-in — never 'Limited Data'", () => {
    const r = run([]);
    expect(r.score).toBe(10);
    expect(r.state).toBe("Ready");
  });
  it("drops sharply right after a hard workout", () => {
    const r = run([session(0.2, { rpe: 9, durationMin: 60 })]);
    expect(r.score).toBeLessThanOrEqual(2);
    expect(r.state).toBe("Recovery Recommended");
    expect(r.reason).toContain("Iron Builder");
  });
  it("recovers over the following hours", () => {
    const scores = [0.5, 6, 12, 24, 48].map((h) => run([session(h)]).score);
    for (let k = 1; k < scores.length; k++) expect(scores[k]).toBeGreaterThanOrEqual(scores[k - 1]!);
    expect(scores.at(-1)).toBe(10);
  });
  it("is back to 10 after one to two rest days", () => {
    expect(run([session(40)]).score).toBeGreaterThanOrEqual(9);
    expect(run([session(50)]).score).toBe(10);
  });
  it("light recovery sessions cost little", () => {
    expect(run([session(0.5, { category: "RECOVERY", rpe: null })]).score).toBeGreaterThanOrEqual(8);
  });
  it("lowers for soreness, poor sleep and a low self-rating", () => {
    const r = run([], { soreness: 9, sleepHours: 4.5, sleepQuality: 2, readiness: 3 });
    expect(r.score).toBeLessThanOrEqual(5);
    expect(r.reason).toMatch(/Soreness 9\/10/);
  });
  it("lowers after many consecutive training days", () => {
    expect(run([], null, 7).score).toBe(8);
  });
});
