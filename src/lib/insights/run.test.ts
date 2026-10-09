import { describe, expect, it } from "vitest";
import { runWeeklyInsights, reportWeekStart, memberDue, type SendEmail } from "./insights.server";

type Row = Record<string, unknown>;

/** Tiny in-memory stand-in for the database client, enough for the weekly job. */
function fakeDb(tables: Record<string, Row[]>) {
  const unique: Record<string, string[]> = { notifications: ["user_id", "dedupe_key"], broadcast_email_sends: ["user_id", "dedupe_key"] };
  const from = (table: string) => {
    const filters: ((r: Row) => boolean)[] = [];
    let mode: "select" | "update" = "select";
    let patch: Row = {};
    const rows = () => (tables[table] ??= []);
    const q: any = {
      select: () => q,
      eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), q),
      in: (c: string, v: unknown[]) => (filters.push((r) => v.includes(r[c])), q),
      is: (c: string, v: unknown) => (filters.push((r) => (r[c] ?? null) === v), q),
      gte: (c: string, v: string) => (filters.push((r) => String(r[c] ?? "") >= v), q),
      limit: () => q,
      maybeSingle: async () => ({ data: rows().filter((r) => filters.every((f) => f(r)))[0] ?? null, error: null }),
      insert: async (row: Row) => {
        const keys = unique[table];
        if (keys && rows().some((r) => keys.every((k) => r[k] === row[k]))) return { error: { code: "23505", message: "duplicate" } };
        rows().push({ ...row });
        return { error: null };
      },
      upsert: async (row: Row) => {
        const keys = unique[table]!;
        if (!rows().some((r) => keys.every((k) => r[k] === row[k]))) rows().push({ ...row });
        return { error: null };
      },
      update: (p: Row) => ((mode = "update"), (patch = p), q),
      then: (res: (v: unknown) => void) => {
        const hit = rows().filter((r) => filters.every((f) => f(r)));
        if (mode === "update") hit.forEach((r) => Object.assign(r, patch));
        res({ data: hit, error: null });
      },
    };
    return q;
  };
  return { from, storage: { from: () => ({ upload: async () => ({ error: null }), createSignedUrl: async () => ({ data: { signedUrl: "https://example.test/chart.png" }, error: null }) }) } } as never;
}

const MONDAY_0700_NICOSIA = new Date("2026-10-12T04:00:00Z");
const member = (id: string, extra: Row = {}) => ({ id, email: `${id}@test.local`, display_name: `Test ${id}`, timezone: "Europe/Nicosia", email_weekly_insights: true, ...extra });
const done = (user_id: string, day: string) => ({ id: `${user_id}-${day}`, user_id, name: "Session", category: "STRENGTH", status: "completed", completed_at: `${day}T08:00:00Z`, created_at: `${day}T07:00:00Z`, duration_min: 30, deleted_at: null });

function world() {
  return {
    profiles: [member("active"), member("quiet"), member("expired"), member("noemail", { email_weekly_insights: false }), member("newbie")],
    workouts: [done("active", "2026-10-06"), done("active", "2026-10-08"), done("quiet", "2026-09-01"), done("expired", "2026-10-07"), done("noemail", "2026-10-09")],
    subscriptions: [{ user_id: "expired", status: "canceled", current_period_end: "2026-09-01T00:00:00Z" }],
    notifications: [] as Row[],
    broadcast_email_sends: [] as Row[],
  };
}

describe("weekly Insights job", () => {
  it("sends one inbox report to everyone with history, email only where allowed, nothing to new accounts", async () => {
    const t = world();
    const sent: string[] = [];
    const send: SendEmail = async (x) => void sent.push(x.to);
    const r = await runWeeklyInsights(fakeDb(t), { now: MONDAY_0700_NICOSIA, send });
    expect(r.failures).toEqual([]);
    expect(t.notifications.map((n) => n.user_id).sort()).toEqual(["active", "expired", "noemail", "quiet"]);
    expect(t.notifications.every((n) => n.dedupe_key === "insights-inbox:2026-10-05")).toBe(true);
    expect(sent.sort()).toEqual(["active@test.local", "expired@test.local", "quiet@test.local"]);
    expect(t.broadcast_email_sends.every((s) => s.state === "sent")).toBe(true);
  });

  it("a second run sends nothing new", async () => {
    const t = world();
    const sent: string[] = [];
    const send: SendEmail = async (x) => void sent.push(x.to);
    await runWeeklyInsights(fakeDb(t), { now: MONDAY_0700_NICOSIA, send });
    const again = await runWeeklyInsights(fakeDb(t), { now: MONDAY_0700_NICOSIA, send });
    expect(again).toMatchObject({ inbox: 0, emails: 0 });
    expect(sent.length).toBe(3);
    expect(t.notifications.length).toBe(4);
  });

  it("retry after an email failure delivers it once, without skipping that member", async () => {
    const t = world();
    const keys: string[] = [];
    let fail = true;
    const send: SendEmail = async (x) => {
      if (x.to.startsWith("active") && fail) throw new Error("provider down");
      keys.push(x.idempotencyKey);
    };
    const first = await runWeeklyInsights(fakeDb(t), { now: MONDAY_0700_NICOSIA, send });
    expect(first.failures.length).toBe(1);
    expect(t.broadcast_email_sends.find((s) => s.user_id === "active")?.state).toBe("sending");
    fail = false;
    const second = await runWeeklyInsights(fakeDb(t), { now: new Date("2026-10-12T05:00:00Z"), send });
    expect(second).toMatchObject({ inbox: 0, emails: 1, failures: [] });
    expect(keys.filter((k) => k.endsWith(":active"))).toEqual(["insights-email:2026-10-05:active"]);
    expect(t.notifications.filter((n) => n.user_id === "active").length).toBe(1);
  });

  it("crash after the provider accepted (before marking sent) re-sends with the same key so the provider ignores it", async () => {
    const t = world();
    const keys: string[] = [];
    await runWeeklyInsights(fakeDb(t), { now: MONDAY_0700_NICOSIA, send: async (x) => void keys.push(x.idempotencyKey) });
    const row = t.broadcast_email_sends.find((s) => s.user_id === "quiet")!;
    row.state = "sending"; // simulate the crash window
    await runWeeklyInsights(fakeDb(t), { now: MONDAY_0700_NICOSIA, send: async (x) => void keys.push(x.idempotencyKey) });
    const quietKeys = keys.filter((k) => k.endsWith(":quiet"));
    expect(quietKeys.length).toBe(2);
    expect(new Set(quietKeys).size).toBe(1);
  });

  it("waits until 06:00 on Monday in each member's own timezone", async () => {
    const t = world();
    t.profiles[0]!.timezone = "America/New_York"; // still Sunday night there
    await runWeeklyInsights(fakeDb(t), { now: MONDAY_0700_NICOSIA, send: async () => undefined });
    expect(t.notifications.some((n) => n.user_id === "active")).toBe(false);
    expect(memberDue(new Date("2026-10-12T02:59:00Z"), "Europe/Nicosia", 6)).toBe(false);
    expect(memberDue(new Date("2026-10-12T03:00:00Z"), "Europe/Nicosia", 6)).toBe(true);
  });

  it("reports the right week across daylight-saving changes", () => {
    // Monday after DST ends (25 Oct 2026): 06:00 local = 04:00 UTC.
    expect(reportWeekStart(new Date("2026-10-26T04:00:00Z"), "Europe/Nicosia", "previous")).toBe("2026-10-19");
    expect(memberDue(new Date("2026-10-26T03:59:00Z"), "Europe/Nicosia", 6)).toBe(false);
    expect(memberDue(new Date("2026-10-26T04:00:00Z"), "Europe/Nicosia", 6)).toBe(true);
    // Monday after DST starts (29 Mar 2026): 06:00 local = 03:00 UTC.
    expect(reportWeekStart(new Date("2026-03-30T03:00:00Z"), "Europe/Nicosia", "previous")).toBe("2026-03-23");
    expect(memberDue(new Date("2026-03-30T02:59:00Z"), "Europe/Nicosia", 6)).toBe(false);
    expect(memberDue(new Date("2026-03-30T03:00:00Z"), "Europe/Nicosia", 6)).toBe(true);
  });
});
