import { afterEach, describe, expect, it, vi } from "vitest";

const { createClient, query } = vi.hoisted(() => ({
  createClient: vi.fn(),
  query: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      handler: (handler: unknown) => handler,
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { getFeaturedSmartyWorkouts } from "../smarty-workouts.functions";

function setup() {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubEnv("SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  const eq = vi.fn((...args: unknown[]) => query(...args));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  createClient.mockReturnValue({ from });
  return { from, select, eq };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe("featured workout availability", () => {
  it("returns an empty list instead of rejecting when the database returns an error", async () => {
    setup();
    query.mockResolvedValue({ data: null, error: { code: "503" } });
    await expect(getFeaturedSmartyWorkouts()).resolves.toEqual([]);
  });

  it("returns an empty list when the connection throws", async () => {
    setup();
    query.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(getFeaturedSmartyWorkouts()).resolves.toEqual([]);
  });

  it("returns an empty list when client initialization fails", async () => {
    setup();
    createClient.mockImplementation(() => { throw new Error("Unavailable configuration"); });
    await expect(getFeaturedSmartyWorkouts()).resolves.toEqual([]);
  });

  it("preserves visible-only reads, latest-three order and card metadata on success", async () => {
    const { from, select, eq } = setup();
    query.mockResolvedValue({ data: [
      { id: "older", name: "Older", created_at: "2026-11-01", legacy_id: null },
      { id: "newest", name: "Newest", created_at: "2026-11-12", legacy_id: null },
      { id: "second", name: "Second", created_at: "2026-11-11", legacy_id: null },
      { id: "third", name: "Third", created_at: "2026-11-10", legacy_id: null },
    ], error: null });
    const result = await getFeaturedSmartyWorkouts();
    expect(result.map((row) => row.id)).toEqual(["newest", "second", "third"]);
    expect(result[0]).toEqual({ id: "newest", name: "Newest", created_at: "2026-11-12" });
    expect(from).toHaveBeenCalledWith("smarty_workouts");
    expect(select).toHaveBeenCalledWith(expect.not.stringContaining("main_workout"));
    expect(eq).toHaveBeenCalledWith("is_visible", true);
  });
});