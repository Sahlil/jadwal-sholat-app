import type { PrayerKey } from "@/types/sholat";

export const Colors = {
  primary: "#0F766E",
  primaryDark: "#115E59",
  background: "#F1F5F9",
  card: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  accent: "#D97706",
  danger: "#DC2626",
} as const;

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
