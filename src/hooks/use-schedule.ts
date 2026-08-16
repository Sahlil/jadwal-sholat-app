import { useCallback, useEffect, useState } from "react";

import { getJadwalPeriod, getJadwalToday } from "@/api/sholat";
import { syncCityData } from "@/services/offline";
import { getJadwalPeriod as getLocalPeriod, getJadwalToday as getLocalToday, upsertMonth } from "@/storage/schedule-repo";
import type { JadwalResponse } from "@/types/sholat";
import { toDateKey } from "@/utils/date";

export type ScheduleSource = "local" | "network";

interface UseScheduleResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  source: ScheduleSource;
  refetch: () => void;
}

// --- Hari ini ---

async function localToday(cityId: string): Promise<JadwalResponse | null> {
  return getLocalToday(cityId, toDateKey(new Date()));
}

async function networkToday(
  cityId: string,
  local: JadwalResponse | null,
): Promise<{ data: JadwalResponse; source: ScheduleSource } | null> {
  try {
    const fresh = await getJadwalToday(cityId);
    await upsertMonth(cityId, fresh);
    syncCityData({ id: cityId, lokasi: fresh.kabko }).catch(() => {});
    return { data: fresh, source: "network" };
  } catch {
    if (local) return null;
    throw new Error("Terjadi kesalahan jaringan. Pastikan internet Anda aktif.");
  }
}

export function useTodaySchedule(cityId: string): UseScheduleResult<JadwalResponse> {
  const [data, setData] = useState<JadwalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ScheduleSource>("local");
  const [reload, setReload] = useState(0);

  const refetch = useCallback(() => setReload((t) => t + 1), []);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return;
        setData(null);
        setError(null);
        setLoading(true);
        setSource("local");
      })
      .then(() => localToday(cityId))
      .then((local) => {
        if (active && local) {
          setData(local);
          setLoading(false);
          setSource("local");
        }
        return local;
      })
      .then((local) => networkToday(cityId, local))
      .then((fresh) => {
        if (active && fresh) {
          setData(fresh.data);
          setSource(fresh.source);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [cityId, reload]);

  return { data, loading, error, source, refetch };
}

// --- Bulanan ---

async function localMonth(cityId: string, monthKey: string): Promise<JadwalResponse | null> {
  return getLocalPeriod(cityId, monthKey);
}

async function networkMonth(
  cityId: string,
  monthKey: string,
  local: JadwalResponse | null,
): Promise<{ data: JadwalResponse; source: ScheduleSource } | null> {
  try {
    const fresh = await getJadwalPeriod(cityId, monthKey);
    await upsertMonth(cityId, fresh);
    return { data: fresh, source: "network" };
  } catch {
    if (local) return null;
    throw new Error("Terjadi kesalahan jaringan. Pastikan internet Anda aktif.");
  }
}

export function useMonthSchedule(
  cityId: string,
  monthKey: string,
): UseScheduleResult<JadwalResponse> {
  const [data, setData] = useState<JadwalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ScheduleSource>("local");
  const [reload, setReload] = useState(0);

  const refetch = useCallback(() => setReload((t) => t + 1), []);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return;
        setData(null);
        setError(null);
        setLoading(true);
        setSource("local");
      })
      .then(() => localMonth(cityId, monthKey))
      .then((local) => {
        if (active && local) {
          setData(local);
          setLoading(false);
          setSource("local");
        }
        return local;
      })
      .then((local) => networkMonth(cityId, monthKey, local))
      .then((fresh) => {
        if (active && fresh) {
          setData(fresh.data);
          setSource(fresh.source);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [cityId, monthKey, reload]);

  return { data, loading, error, source, refetch };
}