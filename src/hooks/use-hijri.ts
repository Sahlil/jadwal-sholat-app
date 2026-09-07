import { useCallback, useEffect, useState } from "react";

import { getHijriByDate, getHijriMonth as fetchHijriMonth } from "@/api/hijri";
import { getJadwalToday as getLocalJadwalToday } from "@/storage/schedule-repo";
import {
  getCachedHijriMonth,
  getCachedHijriToday,
  getCachedHijriTodayAdjusted,
  saveCachedHijriMonth,
  saveCachedHijriToday,
  saveCachedHijriTodayAdjusted,
} from "@/storage/cache";
import type { HijriDate, HijriMonthMap } from "@/types/hijri";
import { toDateKey } from "@/utils/date";
import { adjustHijriByMaghrib } from "@/utils/hijri";

interface UseHijriResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Tanggal hijriyah hari ini: baca cache harian dulu, lalu segarkan dari API aladhan. */
export function useHijriToday(): UseHijriResult<HijriDate> {
  const [data, setData] = useState<HijriDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const dateKey = toDateKey(new Date());

    getCachedHijriToday(dateKey)
      .then((local) => {
        const cached = local?.data ?? null;
        if (active && cached) {
          setData(cached);
          setLoading(false);
        }
        return cached;
      })
      .then((local) =>
        getHijriByDate(new Date())
          .then(async (fresh) => {
            await saveCachedHijriToday(dateKey, fresh);
            return fresh;
          })
          .catch(() => {
            if (!local) throw new Error("Terjadi kesalahan jaringan. Pastikan internet Anda aktif.");
            return null;
          }),
      )
      .then((fresh) => {
        if (active && fresh) setData(fresh);
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

/**
 * Tanggal hijriyah hari ini yang sudah disesuaikan dengan waktu Maghrib.
 * Membutuhkan cityId untuk mengambil jadwal Maghrib hari ini dari storage lokal.
 */
export function useHijriTodayAdjusted(cityId: string): UseHijriResult<HijriDate> {
  const [data, setData] = useState<HijriDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const dateKey = toDateKey(new Date());

    // Helper: ambil base hijri (dari cache/API) lalu adjust pakai maghrib dari jadwal lokal
    const loadAndAdjust = async (): Promise<HijriDate | null> => {
      // 1) Coba ambil adjusted dari cache per kota
      const cachedAdjusted = await getCachedHijriTodayAdjusted(cityId, dateKey);
      if (cachedAdjusted?.data) {
        return cachedAdjusted.data;
      }

      // 2) Ambil base hijri dari cache
      const cachedEntry = await getCachedHijriToday(dateKey);
      const baseHijri = cachedEntry?.data ?? null;

      // 3) Ambil jadwal lokal untuk dapatkan maghrib
      const localJadwal = await getLocalJadwalToday(cityId, dateKey);
      const maghribTime = localJadwal?.jadwal[dateKey]?.maghrib;

      // 4) Kalau ada base hijri dan maghrib, adjust
      if (baseHijri && maghribTime) {
        const adjusted = adjustHijriByMaghrib(baseHijri, maghribTime, new Date());
        await saveCachedHijriTodayAdjusted(cityId, dateKey, adjusted);
        return adjusted;
      }
      // Fallback: return base hijri tanpa adjust
      return baseHijri;
    };

    // Initial load dari cache (instant)
    loadAndAdjust().then((adjusted) => {
      if (active && adjusted) {
        setData(adjusted);
        setLoading(false);
      }
    });

    // Refresh dari API -> cache -> adjust
    getHijriByDate(new Date())
      .then(async (fresh) => {
        await saveCachedHijriToday(dateKey, fresh);
        return fresh;
      })
      .then(async (fresh) => {
        // Adjust pakai jadwal lokal terbaru
        const localJadwal = await getLocalJadwalToday(cityId, dateKey);
        const maghribTime = localJadwal?.jadwal[dateKey]?.maghrib;
        let adjusted = fresh;
        if (maghribTime) {
          adjusted = adjustHijriByMaghrib(fresh, maghribTime, new Date());
        }
        // Save adjusted ke cache per kota
        await saveCachedHijriTodayAdjusted(cityId, dateKey, adjusted);
        return adjusted;
      })
      .then((adjusted) => {
        if (active && adjusted) setData(adjusted);
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Auto-refresh tiap menit untuk detect lewat Maghrib
    const interval = setInterval(() => {
      if (!active) return;
      loadAndAdjust().then((adjusted) => {
        if (active && adjusted) setData(adjusted);
      });
    }, 60_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [cityId]);

  return { data, loading, error };
}

/** Kalender hijriyah satu bulan gregorian "YYYY-MM": cache dulu, lalu refresh dari API. */
export function useHijriMonth(monthKey: string): UseHijriResult<HijriMonthMap> & { refetch: () => void } {
  const [data, setData] = useState<HijriMonthMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const refetch = useCallback(() => setReload((t) => t + 1), []);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return;
        setLoading(true);
        setError(null);
      })
      .then(() => getCachedHijriMonth(monthKey))
      .then((local) => {
        const cached = local?.data ?? null;
        if (active && cached && Object.keys(cached).length > 0) {
          setData(cached);
          setLoading(false);
        }
        return cached;
      })
      .then((local) =>
        fetchHijriMonth(monthKey)
          .then(async (fresh) => {
            await saveCachedHijriMonth(monthKey, fresh);
            return fresh;
          })
          .catch((err: Error) => {
            if (local && Object.keys(local).length > 0) return null;
            throw err;
          }),
      )
      .then((fresh) => {
        if (active && fresh) setData(fresh);
      })
      .catch((err: Error) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan jaringan. Pastikan internet Anda aktif.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [monthKey, reload]);

  return { data, loading, error, refetch };
}
