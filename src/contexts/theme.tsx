import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  darkTheme,
  lightTheme,
  type ThemeColors,
  type ThemeMode,
} from "@/constants/theme";

const THEME_KEY = "theme-mode";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") {
          setModeState(saved);
        }
      })
      .catch(() => {
        // Gagal membaca preferensi — gunakan default light.
      })
      .finally(() => setLoaded(true));
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {
      // Gagal menyimpan — tidak menghentikan aplikasi.
    });
  };

  const value = useMemo<ThemeContextValue>(() => {
    const colors = mode === "dark" ? darkTheme : lightTheme;
    return {
      mode,
      colors,
      setMode,
      toggleTheme: () => setMode(mode === "dark" ? "light" : "dark"),
    };
  }, [mode]);

  // Sembunyikan konten sampai preferensi dibaca agar tidak "blink".
  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme harus dipakai di dalam ThemeProvider.");
  }
  return ctx;
}