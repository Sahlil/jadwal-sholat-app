import type { PrayerKey } from "@/types/sholat";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  danger: string;
  onPrimary: string;
  highlight: string;
  warningBg: string;
  warningText: string;
}

export const lightTheme: ThemeColors = {
  primary: "#0F766E",
  primaryDark: "#115E59",
  background: "#F1F5F9",
  card: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  accent: "#D97706",
  danger: "#DC2626",
  onPrimary: "#FFFFFF",
  highlight: "#ECFDF5",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
};

export const darkTheme: ThemeColors = {
  primary: "#0F766E",
  primaryDark: "#115E59",
  background: "#0B1220",
  card: "#1E293B",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  border: "#334155",
  accent: "#F59E0B",
  danger: "#F87171",
  onPrimary: "#FFFFFF",
  highlight: "#0F3D33",
  warningBg: "#3B2F1F",
  warningText: "#FDE68A",
};

/** Palet warna yang aktif (light). Dipertahankan untuk kompatibilitas. */
export const Colors: ThemeColors = lightTheme;

/** Urutan waktu sholat sesuai data API. */
export const PRAYER_ORDER: { key: PrayerKey; label: string }[] = [
  { key: "imsak", label: "Imsak" },
  { key: "subuh", label: "Subuh" },
  { key: "terbit", label: "Terbit" },
  { key: "dhuha", label: "Dhuha" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" },
];
