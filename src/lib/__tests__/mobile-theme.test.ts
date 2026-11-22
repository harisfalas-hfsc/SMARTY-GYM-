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

describe("independent dark theme defaults", () => {
  it("defaults mobile to dark even with a saved desktop light preference", () => {
    expect(initialTheme(true, { [THEME_STORAGE_KEY]: "light" })).toBe("dark");
  });
  it("defaults desktop to dark", () => {
    expect(initialTheme(false)).toBe("dark");
  });
  it("honors an explicit desktop dark choice", () => {
    expect(initialTheme(false, { [THEME_STORAGE_KEY]: "dark" })).toBe("dark");
  });
  it("defaults desktop to dark when storage is unavailable", () => {
    expect(initialTheme(false, {}, true)).toBe("dark");
  });
  it("defaults desktop to dark with an invalid saved preference", () => {
    expect(initialTheme(false, { [THEME_STORAGE_KEY]: "invalid" })).toBe("dark");
  });
  it("keeps desktop dark despite a previous desktop light preference", () => {
    expect(initialTheme(false, { [THEME_STORAGE_KEY]: "light", [MOBILE_THEME_STORAGE_KEY]: "dark" })).toBe("dark");
  });
  it("keeps desktop dark even when both saved preferences are light", () => {
    expect(initialTheme(false, { [THEME_STORAGE_KEY]: "light", [MOBILE_THEME_STORAGE_KEY]: "light" })).toBe("dark");
  });
  it("honors an explicit mobile dark choice independently of desktop", () => {
    expect(initialTheme(true, { [MOBILE_THEME_STORAGE_KEY]: "dark", [THEME_STORAGE_KEY]: "light" })).toBe("dark");
  });
  it("defaults mobile to dark when storage is unavailable", () => {
    expect(initialTheme(true, {}, true)).toBe("dark");
  });
  it("honors an explicit mobile light choice independently of desktop", () => {
    expect(initialTheme(true, { [MOBILE_THEME_STORAGE_KEY]: "light", [THEME_STORAGE_KEY]: "dark" })).toBe("light");
  });
  it("defaults mobile to dark with an invalid saved preference", () => {
    expect(initialTheme(true, { [MOBILE_THEME_STORAGE_KEY]: "invalid" })).toBe("dark");
  });
});