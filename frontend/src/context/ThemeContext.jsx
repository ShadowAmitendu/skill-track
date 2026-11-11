import { useState, useEffect, useCallback } from "react";
import { Classes } from "@blueprintjs/core";
import { ThemeContext } from "./theme-context";

const THEME_STORAGE_KEY = "skilltrack_theme";

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // ignore storage / matchMedia errors
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark", Classes.DARK);
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark", Classes.DARK);
      root.style.colorScheme = "light";
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    const normalized = nextTheme === "dark" ? "dark" : "light";
    setThemeState(normalized);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
