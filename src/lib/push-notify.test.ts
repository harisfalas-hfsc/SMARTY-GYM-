import { describe, expect, it } from "vitest";
import { isStaleTokenResponse, pushPayload } from "./push-notify.server";

describe("browser push", () => {
  it("links relative paths to smartygym.com", () => {
    const p = pushPayload("t", { title: "New Workout Added!", body: "x", path: "/smarty-workouts/abc", tag: "k" });
    expect(p.message.webpush.fcm_options.link).toBe("https://smartygym.com/smarty-workouts/abc");
    expect(p.message.token).toBe("t");
  });
  it("keeps absolute links", () => {
    const p = pushPayload("t", { title: "a", body: "b", path: "https://smartygym.com/blog/x", tag: "k" });
    expect(p.message.data.link).toBe("https://smartygym.com/blog/x");
  });
  it("treats unregistered tokens as stale", () => {
    expect(isStaleTokenResponse(404, "UNREGISTERED")).toBe(true);
    expect(isStaleTokenResponse(500, "oops")).toBe(false);
  });
});
