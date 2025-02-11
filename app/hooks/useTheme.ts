import { useEffect, useState } from "react";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // Gets the user preference for dark mode from "prefers-color-scheme" media query and sets the theme to match that
  useEffect(() => {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDarkMode ? "dark" : "light");
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  return theme;
};
