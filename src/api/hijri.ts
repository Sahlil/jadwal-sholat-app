import { apiGetAladhan } from "@/api/client";
import type { AladhanCalendarDay, AladhanHijri, HijriDate, HijriMonthMap } from "@/types/hijri";

const pad = (value: number) => String(value).padStart(2, "0");

function toHijriDate(raw: AladhanHijri): HijriDate {
  return {
    day: Number(raw.day),
    month: raw.month.number,
    year: Number(raw.year),
    holidays: raw.holidays ?? [],
  };
}

function toGregorianDateKey(usDate: string): string {
  const [day, month, year] = usDate.split("-").map(Number);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Tanggal hijriyah untuk satu hari gregorian. */
export async function getHijriByDate(date: Date): Promise<HijriDate> {
  const key = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  const data = await apiGetAladhan<{ hijri: AladhanHijri }>(`/gToH/${key}`);
  return toHijriDate(data.hijri);
}

/** Kalender hijriyah satu bulan gregorian "YYYY-MM", di-key tanggal "YYYY-MM-DD". */
export async function getHijriMonth(monthKey: string): Promise<HijriMonthMap> {
  const [year, month] = monthKey.split("-").map(Number);
  const days = await apiGetAladhan<AladhanCalendarDay[]>(`/gToHCalendar/${month}/${year}`);

  const map: HijriMonthMap = {};
  for (const { hijri, gregorian } of days) {
    map[toGregorianDateKey(gregorian.date)] = toHijriDate(hijri);
  }
  return map;
}
