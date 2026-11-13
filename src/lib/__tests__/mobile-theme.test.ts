import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, MOBILE_THEME_STORAGE_KEY } from "../theme";

function initialTheme(mobile: boolean, saved: Record<string, string> = {}, unavailable = false) {
  const root = { dark: true, style: { colorScheme: "dark" }, classList: { toggle(_name: string, dark: boolean) { root.dark = dark; } } };
  runInNewContext(THEME_INIT_SCRIPT, {
    window: { matchMedia: () => ({ matches: mobile }) },
    document: { documentElement: root },
    localStorage: { getItem: (key: string) => { if (unavailable) throw new Error("Unavailable"); return saved[key] ?? null; } },
  });
  return root.style.colorScheme;
}

describe("independent mobile theme default", () => {
  it("defaults mobile to light even with a saved desktop dark preference", () => {
    expect(initialTheme(true, { [THEME_STORAGE_KEY]: "dark" })).toBe("light");
  });
  it("preserves the desktop dark default", () => {
    expect(initialTheme(false)).toBe("dark");
  });
  it("preserves the saved desktop light preference despite mobile dark", () => {
    expect(initialTheme(false, { [THEME_STORAGE_KEY]: "light", [MOBILE_THEME_STORAGE_KEY]: "dark" })).toBe("light");
  });
  it("honors an explicit mobile dark choice independently of desktop", () => {
    expect(initialTheme(true, { [MOBILE_THEME_STORAGE_KEY]: "dark", [THEME_STORAGE_KEY]: "light" })).toBe("dark");
  });
  it("defaults mobile to light when storage is unavailable", () => {
    expect(initialTheme(true, {}, true)).toBe("light");
  });
});