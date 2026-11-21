import { describe, expect, it } from "vitest";
import { WOD_PHOTO_INTERVAL_MS, WOD_LOADING_PHOTO, wodFeaturePhotoAt, wodPhotoAt } from "./photo-rotation";

describe("daily feature photo rotation", () => {
  it("keeps the original desktop cover static at every interval", () => {
    for (const elapsed of [0, 1500, 3000]) expect(wodFeaturePhotoAt(false, ["one.jpg", "two.jpg"], elapsed, "original.jpg")).toBe("original.jpg");
  });
  it("rotates only mobile photos and starts each card with its own picture", () => {
    expect(wodFeaturePhotoAt(true, ["one.jpg", "two.jpg"], 0, "original.jpg", 1)).toBe("two.jpg");
    expect(wodFeaturePhotoAt(true, ["one.jpg", "two.jpg"], 1500, "original.jpg", 1)).toBe("one.jpg");
  });
  it("never flashes the old mobile cover before daily photos load", () => {
    expect(wodFeaturePhotoAt(null, [], 0, "original.jpg")).toBe(WOD_LOADING_PHOTO);
    expect(wodFeaturePhotoAt(true, [], 0, "original.jpg")).toBe(WOD_LOADING_PHOTO);
  });
  it("alternates the two WOD pictures exactly every 1.5 seconds", () => {
    const photos = ["bodyweight.jpg", "equipment.jpg"];
    expect(WOD_PHOTO_INTERVAL_MS).toBe(1500);
    expect(wodPhotoAt(photos, 0, "fallback.jpg")).toBe("bodyweight.jpg");
    expect(wodPhotoAt(photos, 1499, "fallback.jpg")).toBe("bodyweight.jpg");
    expect(wodPhotoAt(photos, 1500, "fallback.jpg")).toBe("equipment.jpg");
    expect(wodPhotoAt(photos, 2999, "fallback.jpg")).toBe("equipment.jpg");
    expect(wodPhotoAt(photos, 3000, "fallback.jpg")).toBe("bodyweight.jpg");
  });
  it("keeps the actual single recovery picture instead of inventing a second workout", () => {
    expect(wodPhotoAt(["recovery.jpg"], 1500, "fallback.jpg")).toBe("recovery.jpg");
    expect(wodPhotoAt(["recovery.jpg"], 3000, "fallback.jpg")).toBe("recovery.jpg");
  });
  it("uses the existing fallback when no daily picture is available", () => {
    expect(wodPhotoAt([], 1500, "fallback.jpg")).toBe("fallback.jpg");
  });
});