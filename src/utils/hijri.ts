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

/** Hari per bulan hijriyah (estimasi 29/30, akan dikoreksi oleh API per hari). */
const HIJRI_MONTH_DAYS = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];

/**
 * Tambah 1 hari ke HijriDate (handle rollover bulan/tahun).
 * Menggunakan estimasi 29/30 hari per bulan — akurasi aktual bergantung pada
 * pengamatan hilal, tapi cukup untuk adjust client-side berbasis Maghrib.
 */
export function addHijriDay(h: HijriDate): HijriDate {
  const daysInMonth = HIJRI_MONTH_DAYS[h.month - 1] ?? 30;
  if (h.day < daysInMonth) {
    return { ...h, day: h.day + 1 };
  }
  // Rollover ke bulan berikutnya
  if (h.month < 12) {
    return { ...h, day: 1, month: h.month + 1 };
  }
  // Rollover ke tahun berikutnya
  return { ...h, day: 1, month: 1, year: h.year + 1 };
}

/**
 * Adjust tanggal hijriyah berdasarkan waktu Maghrib.
 * - Jika `now` >= `maghribTime` (format "HH:mm"), hari hijriyah sudah berganti.
 * - Return hijri date yang sudah disesuaikan.
 */
export function adjustHijriByMaghrib(
  baseHijri: HijriDate,
  maghribTime: string,
  now: Date = new Date(),
): HijriDate {
  const [maghribHour, maghribMinute] = maghribTime.split(":").map(Number);
  const maghribDate = new Date(now);
  maghribDate.setHours(maghribHour, maghribMinute, 0, 0);

  if (now >= maghribDate) {
    return addHijriDay(baseHijri);
  }
  return baseHijri;
}
