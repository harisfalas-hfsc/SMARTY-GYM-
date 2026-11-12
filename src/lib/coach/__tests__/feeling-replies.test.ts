import { describe, expect, it } from "vitest";
import { feelingReply, pickLine } from "../feeling-replies";

const base = { member: true, seed: "acct-1", readinessScore: null, lastSessionName: null, recommendationName: null };
describe("coach feeling replies", () => {
  it("same person, same day gives the same reply", () => {
    const d = new Date(2026, 10, 12, 9);
    expect(feelingReply("great", { ...base, date: d })).toBe(feelingReply("great", { ...base, date: new Date(2026, 10, 12, 10) }));
  });
  it("consecutive days never repeat the same line", () => {
    const pool = ["a", "b", "c"];
    for (let i = 1; i < 30; i++) expect(pickLine(pool, "x", "great", new Date(2026, 0, i))).not.toBe(pickLine(pool, "x", "great", new Date(2026, 0, i + 1)));
  });
  it("uses the real readiness score only for members", () => {
    const d = new Date(2026, 10, 12, 9);
    expect(feelingReply("tired", { ...base, readinessScore: 4, date: d })).toContain("4/10");
    expect(feelingReply("tired", { ...base, member: false, readinessScore: 4, date: d })).not.toContain("/10");
  });
  it("tapping the same feeling again shows a different line", () => {
    const d = new Date(2026, 10, 12, 9);
    const ctx = { member: true, seed: "a", date: d, readinessScore: null, lastSessionName: null, recommendationName: null };
    expect(feelingReply("great", { ...ctx, turn: 1 })).not.toBe(feelingReply("great", ctx));
  });
});
