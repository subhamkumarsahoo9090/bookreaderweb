"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ThemeId } from "@/lib/types";

const THEME_KEY = "bookreader_theme";

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "paper", label: "Default" },
  { id: "night", label: "Dark" },
  { id: "sepia", label: "Sepia" },
  { id: "contrast", label: "High Contrast" },
];

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", id);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, token, setUser } = useAuth();
  const [theme, setThemeState] = useState<ThemeId>("paper");

  useEffect(() => {
    const local = localStorage.getItem(THEME_KEY) as ThemeId | null;
    const fromUser = user?.settings?.theme;
    const next =
      fromUser && THEMES.some((t) => t.id === fromUser)
        ? fromUser
        : local && THEMES.some((t) => t.id === local)
          ? local
          : "paper";
    setThemeState(next);
    applyTheme(next);
  }, [user?.settings?.theme]);

  const setTheme = useCallback(
    async (id: ThemeId) => {
      setThemeState(id);
      applyTheme(id);
      localStorage.setItem(THEME_KEY, id);
      if (token) {
        try {
          const res = await authApi.updateSettings(token, { theme: id });
          setUser(res.user);
        } catch {
          // local preference still applied
        }
      }
    },
    [token, setUser]
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
