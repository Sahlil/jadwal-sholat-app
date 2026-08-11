import { PRAYER_ORDER } from "@/constants/theme";
import type { JadwalSholat, PrayerKey } from "@/types/sholat";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const pad = (value: number) => String(value).padStart(2, "0");

/** Konversi Date menjadi kunci bulan "YYYY-MM". */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** Konversi Date menjadi kunci tanggal "YYYY-MM-DD" (waktu lokal). */
export function toDateKey(date: Date): string {
  return `${toMonthKey(date)}-${pad(date.getDate())}`;
}

/** Kunci tanggal hari ini (waktu lokal). */
export const todayDateKey = () => toDateKey(new Date());

/** Geser bulan sebanyak `delta` (mis. -1 = bulan sebelumnya). */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return toMonthKey(date);
}

/** Label bulan, mis. "2026-08" -> "Agustus 2026". */
export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Waktu sholat berikutnya (belum lewat) dari jadwal hari ini, atau null jika semua sudah lewat. */
export function getNextPrayerKey(
  jadwal: JadwalSholat,
  now: Date,
): PrayerKey | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const { key } of PRAYER_ORDER) {
    const [hour, minute] = jadwal[key].split(":").map(Number);
    if (hour * 60 + minute > nowMinutes) return key;
  }

  return null;
}
