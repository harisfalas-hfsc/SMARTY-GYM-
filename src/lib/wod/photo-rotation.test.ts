import { describe, expect, it } from "vitest";
import { WOD_PHOTO_INTERVAL_MS, wodPhotoAt } from "./photo-rotation";

describe("daily feature photo rotation", () => {
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