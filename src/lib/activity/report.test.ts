import { describe, expect, it } from "vitest";
import { buildReport, localMidnightUtc, rangeBounds, reportCsv, sampleReport } from "./report";
describe("user activity report", () => {
  it("uses Cyprus midnight across DST", () => {
    expect(localMidnightUtc("2026-07-01").toISOString()).toBe("2026-06-30T21:00:00.000Z");
    expect(localMidnightUtc("2026-12-01").toISOString()).toBe("2026-11-30T22:00:00.000Z");
    expect(rangeBounds("2026-10-25", "2026-10-25")).toEqual({ from: "2026-10-24T21:00:00.000Z", to: "2026-10-25T22:00:00.000Z" });
  });
  it("groups by member, chronological", () => {
    const r = buildReport("2026-10-09", "2026-10-09", [{ userId: "a", name: "A", email: "", joinedAt: null, access: "Premium", membershipEndsAt: null }], [
      { userId: "a", at: "2026-10-09T10:00:00Z", kind: "completed", text: "x" },
      { userId: "a", at: "2026-10-09T08:00:00Z", kind: "created", text: "y" },
    ]);
    expect(r.users[0].events.map((e) => e.kind)).toEqual(["created", "completed"]);
    expect(reportCsv(r).split("\n")).toHaveLength(3);
  });
  it("sample has 10 users with 5-7 activities", () => {
    const s = sampleReport();
    expect(s.users).toHaveLength(10);
    for (const u of s.users) expect(u.events.length).toBeGreaterThanOrEqual(5);
  });
});
