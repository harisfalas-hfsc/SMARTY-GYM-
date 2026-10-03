import { describe, expect, it, vi } from "vitest";
import { isRecoverablePageImportError } from "./recoverable-page-error";
import { reportLovableError } from "./lovable-error-reporting";

describe("recoverable page imports", () => {
  it("recognizes missing page files without confusing ordinary network failures", () => {
    expect(isRecoverablePageImportError(new TypeError("Failed to fetch dynamically imported module: https://smartygym.com/assets/how-it-works.js"))).toBe(true);
    expect(isRecoverablePageImportError("Importing a module script failed.")).toBe(true);
    expect(isRecoverablePageImportError(new Error("Loading chunk how-it-works failed."))).toBe(true);
    expect(isRecoverablePageImportError(new Error("Cannot read properties of undefined (reading 'Icon')"))).toBe(false);
    expect(isRecoverablePageImportError(new Error("Failed to fetch user profile"))).toBe(false);
  });

  it("does not send a handled import failure to crash reporting", () => {
    const captureException = vi.fn();
    const reportRuntime = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/how-it-works" },
      __lovableEvents: { captureException },
      __lovableReportRuntimeError: reportRuntime,
    });
    reportLovableError(new TypeError("Failed to fetch dynamically imported module: https://smartygym.com/assets/how-it-works.js"));
    expect(captureException).not.toHaveBeenCalled();
    expect(reportRuntime).not.toHaveBeenCalled();
    reportLovableError(new Error("Something unexpected"));
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(reportRuntime).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});