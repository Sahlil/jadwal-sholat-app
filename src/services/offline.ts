import { getJadwalPeriod } from "@/api/sholat";
import { toDateKey } from "@/utils/date";
import type { KabKota } from "@/types/sholat";
import {
  evictCities,
  hasMonth,
  isMonthStale,
  touchCity,
  upsertCity,
  upsertMonth,
} from "@/storage/schedule-repo";

/** Kapasitas maksimum kota yang disimpan (strategi LRU). */
export const CITY_CACHE_CAP = 5;

/** Batas usia data bulan sebelum diunduh ulang (hari). */
export const MONTH_TTL_DAYS = 7;

/** Jeda antar-request bulan untuk menghindari rate limit server. */
export const REQUEST_DELAY_MS = 800;

const pad = (value: number) => String(value).padStart(2, "0");

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function yearMonths(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${pad(i + 1)}`);
}

/** Bulan-bulan yang perlu dipastikan tersedia (tahun berjalan + tahun depan bila Desember). */
function requiredMonths(now: Date): string[] {
  const months = yearMonths(now.getFullYear());
  if (now.getMonth() === 11) {
    months.push(...yearMonths(now.getFullYear() + 1));
  }
  return months;
}

export interface SyncResult {
  downloaded: number;
  evicted: number;
}

/**
 * Unduh jadwal satu tahun (tahun berjalan) untuk satu kota ke SQLite,
 * hanya bulan yang belum ada / sudah basi, lalu terapkan retensi LRU.
 */
export async function syncCityData(city: KabKota): Promise<SyncResult> {
  const now = new Date();
  let downloaded = 0;

  for (const monthKey of requiredMonths(now)) {
    const available = await hasMonth(city.id, monthKey);
    const stale = await isMonthStale(city.id, monthKey, MONTH_TTL_DAYS);
    if (available && !stale) continue;

    try {
      const res = await getJadwalPeriod(city.id, monthKey);
      await upsertMonth(city.id, res);
      downloaded += 1;
    } catch {
      // Offline atau gagal — lewati; data akan diunduh saat berikutnya app dibuka.
    }

    // Jeda antar-request agar tidak dianggap spam oleh server.
    await sleep(REQUEST_DELAY_MS);
  }

  const evicted = (await evictCities(CITY_CACHE_CAP)).length;

  return { downloaded, evicted };
}

/**
 * Pastikan metadata kota tersedia di DB (dipakai saat kota dipilih/aktif)
 * sebelum/bersamaan dengan sinkron penuh. Mengembalikan kunci tanggal hari ini.
 */
export async function prepareCity(city: KabKota): Promise<string> {
  await upsertCity(city, city.lokasi, "");
  await touchCity(city.id);
  return toDateKey(new Date());
}