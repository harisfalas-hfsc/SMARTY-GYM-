import { createContext, useContext, type ReactNode } from "react";

export type Theme = "dark";

export const THEME_STORAGE_KEY = "smartygym-theme";

/** The app is dark-only; this runs before hydration for a dark first frame. */
export const THEME_INIT_SCRIPT = `(function(){try{document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}catch(e){}})();`;

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={{ theme: "dark", setTheme: () => {}, toggleTheme: () => {} }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
