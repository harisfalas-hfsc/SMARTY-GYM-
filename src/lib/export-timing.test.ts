import { describe, expect, it, vi } from "vitest";
import { withExportProgress } from "./export-timing";

describe("download progress watchdog", () => {
  it("allows a batch exceeding 30 seconds when workouts keep loading", async () => {
    vi.useFakeTimers();
    try {
      const result = withExportProgress(async report => {
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 20_000));
          report(`Loaded ${i + 1}`);
        }
        return ["one", "two", "three"];
      }, () => {}, "Stalled");
      await vi.advanceTimersByTimeAsync(60_000);
      expect(await result).toEqual(["one", "two", "three"]);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it("rejects a stalled read after 30 seconds and ignores late progress", async () => {
    vi.useFakeTimers();
    try {
      const report = vi.fn();
      let lateProgress = (_message: string) => {};
      const result = withExportProgress(progress => { lateProgress = progress; return new Promise<never>(() => {}); }, report, "Stalled");
      const assertion = expect(result).rejects.toThrow("Stalled");
      await vi.advanceTimersByTimeAsync(30_000);
      await assertion;
      lateProgress("Late");
      expect(report).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
});