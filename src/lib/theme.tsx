import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "smartygym-theme";
export const MOBILE_THEME_STORAGE_KEY = "smartygym-mobile-theme";
const MOBILE_QUERY = "(max-width: 767px)";

/** Both devices default to light; explicit preferences remain independent. */
export const THEME_INIT_SCRIPT = `(function(){var m=window.matchMedia('${MOBILE_QUERY}').matches;var d=false;try{var t=localStorage.getItem(m?'${MOBILE_THEME_STORAGE_KEY}':'${THEME_STORAGE_KEY}');d=t==='dark';}catch(e){}document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';})();`;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function readStoredTheme(): Theme {
  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  try {
    const saved = localStorage.getItem(mobile ? MOBILE_THEME_STORAGE_KEY : THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

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
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(window.matchMedia(MOBILE_QUERY).matches ? MOBILE_THEME_STORAGE_KEY : THEME_STORAGE_KEY, next);
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
