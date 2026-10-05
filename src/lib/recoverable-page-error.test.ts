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
import { describe as d2, expect as e2, it as i2 } from "vitest";
import { isRecoverablePageImportError as rec } from "./recoverable-page-error";
d2("stale lazy route", () => {
  i2("treats the router's undefined-module error as an update, only from the lazy loader", () => {
    const err = new TypeError("Cannot read properties of undefined (reading 'component')");
    err.stack = "TypeError: ...\n at https://smartygym.com/assets/lazyRouteComponent-R2Oj1pNx.js:1:3751";
    e2(rec(err)).toBe(true);
    const other = new TypeError("Cannot read properties of undefined (reading 'component')");
    other.stack = "TypeError: ...\n at https://smartygym.com/assets/index.js:1:1";
    e2(rec(other)).toBe(false);
  });
});

import { markPageImportFailed } from "./recoverable-page-error";
d2("after a failed page download", () => {
  i2("the empty-page error that follows is never treated as a crash", () => {
    const err = new TypeError("Cannot read properties of undefined (reading 'component')");
    err.stack = "TypeError\n at https://smartygym.com/assets/index-x.js:1:1";
    e2(rec(err)).toBe(false);
    markPageImportFailed();
    e2(rec(err)).toBe(true);
    e2(rec(new TypeError("Cannot read properties of undefined (reading 'name')"))).toBe(false);
  });
});
