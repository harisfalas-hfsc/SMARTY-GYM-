import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "smartygym-theme";
export const MOBILE_THEME_STORAGE_KEY = "smartygym-mobile-theme";
const MOBILE_QUERY = "(max-width: 1023px)";

/** Desktop is dark-only; mobile defaults to dark and honors its saved choice. */
export const THEME_INIT_SCRIPT = `(function(){var m=window.matchMedia('${MOBILE_QUERY}').matches;var d=true;try{if(m){var t=localStorage.getItem('${MOBILE_THEME_STORAGE_KEY}');d=t!=='light';}}catch(e){}document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';})();`;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

function readStoredTheme(): Theme {
  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  if (!mobile) return "dark";
  try {
    const saved = localStorage.getItem(MOBILE_THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Sync with the theme the init script already applied, without a hydration mismatch.
  useEffect(() => {
    const sync = () => {
      const next = readStoredTheme();
      setThemeState(next);
      applyTheme(next);
    };
    sync();
    const query = window.matchMedia(MOBILE_QUERY);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    if (!window.matchMedia(MOBILE_QUERY).matches) {
      setThemeState("dark");
      applyTheme("dark");
      return;
    }
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(MOBILE_THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode); theme still applies for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readStoredTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
