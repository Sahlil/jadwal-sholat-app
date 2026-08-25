import { useCallback, useEffect, useState } from "react";

import { getHijriByDate, getHijriMonth as fetchHijriMonth } from "@/api/hijri";
import {
  getCachedHijriMonth,
  getCachedHijriToday,
  saveCachedHijriMonth,
  saveCachedHijriToday,
} from "@/storage/cache";
import type { HijriDate, HijriMonthMap } from "@/types/hijri";
import { toDateKey } from "@/utils/date";

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
