import type { HijriDate } from "@/types/hijri";

export const HIJRI_MONTHS_ID = [
  "Muharram",
  "Safar",
  "Rabiulawal",
  "Rabiulakhir",
  "Jumadilawal",
  "Jumadilakhir",
  "Rajab",
  "Sya'ban",
  "Ramadhan",
  "Syawal",
  "Zulkaidah",
  "Zulhijah",
];

/** Format "12-03-1448" -> "12 Rabiulawal 1448 H". */
export function formatHijri(h: HijriDate): string {
  return `${h.day} ${HIJRI_MONTHS_ID[h.month - 1]} ${h.year} H`;
}

/**
 * Label bulan untuk tampilan kalender. Satu bulan gregorian dapat memuat
 * dua bulan hijriyah, mis. "Safar – Rabiulawal 1448 H".
 */
export function hijriMonthLabel(dates: HijriDate[]): string {
  if (dates.length === 0) return "";
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.month === last.month && first.year === last.year) {
    return `${HIJRI_MONTHS_ID[first.month - 1]} ${first.year} H`;
  }
  return `${HIJRI_MONTHS_ID[first.month - 1]} – ${HIJRI_MONTHS_ID[last.month - 1]} ${last.year} H`;
}
