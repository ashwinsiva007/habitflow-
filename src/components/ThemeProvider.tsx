"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme =
  | "dark-purple"
  | "dark-ocean"
  | "dark-sunset"
  | "light-purple"
  | "light-ocean"
  | "light-sunset"
  | "system";

export interface ThemeOption {
  id: Theme;
  label: string;
  mode: "dark" | "light";
  accentColor: string;
  bgColor: string;
  emoji: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "dark-purple",  label: "Dark Purple",  mode: "dark",  accentColor: "#7c6aff", bgColor: "#0a0a0f", emoji: "🌌" },
  { id: "dark-ocean",   label: "Dark Ocean",   mode: "dark",  accentColor: "#06b6d4", bgColor: "#030d14", emoji: "🌊" },
  { id: "dark-sunset",  label: "Dark Sunset",  mode: "dark",  accentColor: "#f97316", bgColor: "#0f0805", emoji: "🌇" },
  { id: "light-purple", label: "Light Purple", mode: "light", accentColor: "#6366f1", bgColor: "#f8fafc", emoji: "🌸" },
  { id: "light-ocean",  label: "Light Ocean",  mode: "light", accentColor: "#0891b2", bgColor: "#f0fafa", emoji: "☁️" },
  { id: "light-sunset", label: "Light Sunset", mode: "light", accentColor: "#ea6800", bgColor: "#fffbf5", emoji: "🌅" },
];

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeOptions: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark-purple";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark-purple"
    : "light-purple";
}

function resolveTheme(theme: Theme): string {
  if (theme === "system") return getSystemTheme();
  return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark-purple");

  useEffect(() => {
    const savedTheme = localStorage.getItem("habitflow-theme") as Theme;
    if (savedTheme && savedTheme !== "system") {
      // Migrate legacy "dark"/"light" values
      if (savedTheme === "dark" as any) {
        setThemeState("dark-purple");
      } else if (savedTheme === "light" as any) {
        setThemeState("light-purple");
      } else {
        setThemeState(savedTheme);
      }
    } else if (savedTheme === "system" || !savedTheme) {
      setThemeState(getSystemTheme());
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("habitflow-theme", newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const resolved = resolveTheme(theme);
    root.setAttribute("data-theme", resolved);
  }, [theme]);

  // Listen for system theme changes if set to system
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.setAttribute("data-theme", mediaQuery.matches ? "dark-purple" : "light-purple");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeOptions: THEME_OPTIONS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
