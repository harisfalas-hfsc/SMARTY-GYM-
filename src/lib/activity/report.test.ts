import { describe, expect, it } from "vitest";
import { buildReport, localMidnightUtc, rangeBounds, reportCsv, sampleReport, workoutCreationKind } from "./report";
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
  it("does not report opened library workouts or WODs as created", () => {
    expect(workoutCreationKind({ createdBy: "smarty:library-id", communitySourceId: null, isWod: false })).toBe("opened");
    expect(workoutCreationKind({ createdBy: null, communitySourceId: null, isWod: true })).toBe("opened");
  });
  it("keeps genuine creation and shared-copy actions separate", () => {
    expect(workoutCreationKind({ createdBy: "smarty_coach", communitySourceId: null, isWod: false })).toBe("created");
    expect(workoutCreationKind({ createdBy: "member", communitySourceId: null, isWod: false })).toBe("created");
    expect(workoutCreationKind({ createdBy: "community", communitySourceId: "source-id", isWod: false })).toBe("copied");
  });
});
import { accountEvents, subscriptionText } from "./report";
describe("account lifecycle activity", () => {
  const from = "2026-10-26T00:00:00Z", to = "2026-10-28T00:00:00Z";
  it("labels admin-created accounts as created by the administrator", () => {
    const e = accountEvents({ userId: "t", createdAt: "2026-10-26T19:30:22Z", emailConfirmedAt: null, appMetadata: { must_change_password: true } }, from, to);
    expect(e.map((x) => x.text)).toEqual(["Account created by the administrator"]);
  });
  it("reports email verification and own password", () => {
    const e = accountEvents({ userId: "t", createdAt: "2026-10-26T19:30:00Z", emailConfirmedAt: "2026-10-27T08:00:00Z", appMetadata: { must_change_password: false, password_changed_at: "2026-10-27T08:05:00Z" } }, from, to);
    expect(e.map((x) => x.kind)).toEqual(["joined", "verified", "password"]);
  });
  it("ignores instant confirmation and keeps self sign-ups plain", () => {
    const e = accountEvents({ userId: "u", createdAt: "2026-10-26T10:00:00Z", emailConfirmedAt: "2026-10-26T10:00:05Z", appMetadata: { provider: "google" } }, from, to);
    expect(e.map((x) => x.text)).toEqual(["Created an account"]);
  });
  it("words complimentary grants with their months", () => {
    expect(subscriptionText("admin_grant", "2026-10-26T19:41:00Z", "2026-11-26T19:41:00Z")).toBe("Administrator granted 1-month complimentary Premium");
    expect(subscriptionText("stripe", null, null)).toBe("Subscribed to Premium");
  });
});
