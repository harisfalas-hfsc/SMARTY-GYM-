import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishedWorkoutsAnnouncement, workoutAnnouncementDestination, wantsAnnouncementEmail } from "./broadcast-content";
import { runSmartyPublication, publishSmartyIds } from "./smarty-publication.server";

vi.mock("./broadcast-notify.server", () => ({ announcePublishedSmartyWorkouts: vi.fn(async () => ({ inbox: 2, emails: 1 })) }));
import { announcePublishedSmartyWorkouts } from "./broadcast-notify.server";

const workout = (id: string, category = "MUSCLE BUILDING") => ({ id, category, name: `Workout ${id}` });

describe("publication announcement content", () => {
  it("uses one workout destination and supports legacy notices", () => {
    const a = publishedWorkoutsAnnouncement("action", [workout("one")]);
    expect(a.workoutName).toBe("Workout one");
    expect(workoutAnnouncementDestination(a.dedupeKey)).toBe("/smarty-workouts/one");
    expect(workoutAnnouncementDestination("new-workout:old")).toBe("/smarty-workouts/old");
  });
  it("summarizes 50 same-category workouts with exactly one category link", () => {
    const a = publishedWorkoutsAnnouncement("action", Array.from({ length: 50 }, (_, i) => workout(String(i))));
    expect(a.body).toContain("50 new Muscle Building workouts");
    expect(a.buttonHref).toBe("https://smartygym.com/smarty-workouts/category/muscle-building");
    expect(workoutAnnouncementDestination(a.dedupeKey)).toBe("/smarty-workouts/category/muscle-building");
    expect(a.workoutName).toBeUndefined();
  });
  it("uses only the collection link for mixed categories", () => {
    const a = publishedWorkoutsAnnouncement("action", [workout("1"), workout("2", "CARDIO"), workout("3", "PILATES"), workout("4", "RECOVERY")]);
    expect(a.body).toContain("4 new workouts");
    expect(a.supportingText).toContain("Muscle Building, Cardio, Pilates, Recovery");
    expect(workoutAnnouncementDestination(a.dedupeKey)).toBe("/smarty-workouts");
  });
  it("deduplicates rows and honors email opt-outs for action notices", () => {
    const a = publishedWorkoutsAnnouncement("action", [workout("1"), workout("1")]);
    expect(a.heading).toBe("New Workout Added!");
    expect(wantsAnnouncementEmail({ email_new_workouts: false }, a.dedupeKey)).toBe(false);
    expect(workoutAnnouncementDestination("new-workout-publish:a:%2F%2Fevil.com")).toBeNull();
    expect(workoutAnnouncementDestination("new-workout-publish:a:%XX")).toBeNull();
  });
});

/** In-memory fixture: never writes production workouts or sends email. */
function fixture() {
  const history = new Map<string, any>();
  const rows = new Map<string, any>();
  const db = { from(table: string) {
    let operation = "select", value: any, ids: string[] = [], filters: [string, any][] = [];
    const q: any = {
      select: () => q,
      eq: (key: string, val: any) => { filters.push([key, val]); return q; },
      in: (_: string, val: string[]) => { ids = val; return q; },
      insert: (val: any) => { operation = "insert"; value = val; return q; },
      update: (val: any) => { operation = "update"; value = val; return q; },
      maybeSingle: async () => { const result = execute(); return { ...result, data: result.data?.[0] ?? null }; },
      then: (resolve: any, reject: any) => Promise.resolve(execute()).then(resolve, reject),
    };
    function execute() {
      const store = table === "cron_runs" ? history : rows;
      if (operation === "insert") {
        if (store.has(value.id)) return { data: null, error: { message: "duplicate" } };
        store.set(value.id, structuredClone(value)); return { data: [value], error: null };
      }
      const matches = [...store.values()].filter((r) => (!ids.length || ids.includes(r.id)) && filters.every(([key, val]) => r[key] === val));
      if (operation === "update") matches.forEach((r) => Object.assign(r, structuredClone(value)));
      return { data: structuredClone(matches), error: null };
    }
    return q;
  } };
  return { db: db as never, history, rows };
}

describe("publication actions", () => {
  beforeEach(() => vi.mocked(announcePublishedSmartyWorkouts).mockClear());
  it("publishes only hidden eligible IDs, excluding already visible and unrelated rows", async () => {
    const f = fixture();
    f.rows.set("hidden", { ...workout("hidden"), is_visible: false });
    f.rows.set("visible", { ...workout("visible"), is_visible: true });
    f.rows.set("held", { ...workout("held"), is_visible: false });
    const result = await runSmartyPublication(f.db, "a", () => publishSmartyIds(f.db, ["hidden", "visible"], 1));
    expect(result).toMatchObject({ count: 1, held: 1, announcement: { inbox: 2, emails: 1 } });
    expect(f.rows.get("held").is_visible).toBe(false);
    expect(announcePublishedSmartyWorkouts).toHaveBeenCalledTimes(1);
    expect(vi.mocked(announcePublishedSmartyWorkouts).mock.calls[0]?.[2]).toHaveLength(1);
  });
  it("returns the stored result on retry but announces a separate action", async () => {
    const f = fixture(); const change = vi.fn(async () => ({ workouts: [workout("one")], held: 0 }));
    await runSmartyPublication(f.db, "a", change);
    await runSmartyPublication(f.db, "a", change);
    expect(change).toHaveBeenCalledTimes(1);
    expect(announcePublishedSmartyWorkouts).toHaveBeenCalledTimes(1);
    await runSmartyPublication(f.db, "b", change);
    expect(announcePublishedSmartyWorkouts).toHaveBeenCalledTimes(2);
  });
  it("retries delivery with the saved subset without republishing", async () => {
    const f = fixture(); const change = vi.fn(async () => ({ workouts: [workout("one")], held: 2, error: "partial write failure" }));
    vi.mocked(announcePublishedSmartyWorkouts).mockResolvedValueOnce({ inbox: 2, emails: 0, error: "email failed" });
    expect(await runSmartyPublication(f.db, "a", change)).toMatchObject({ count: 1, held: 2, publicationError: "partial write failure" });
    await runSmartyPublication(f.db, "a", change);
    expect(change).toHaveBeenCalledTimes(1);
    expect(f.history.get("a").status).toBe("ok");
  });
  it("blocks a concurrent or interrupted action", async () => {
    const f = fixture(); f.history.set("a", { id: "a", job_key: "new-workout-announcement", status: "running" });
    const change = vi.fn();
    expect(await runSmartyPublication(f.db, "a", change)).toHaveProperty("error");
    expect(change).not.toHaveBeenCalled();
  });
});