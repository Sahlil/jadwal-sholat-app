import AsyncStorage from "@react-native-async-storage/async-storage";

import type { JadwalResponse, KabKota } from "@/types/sholat";

interface CacheEntry<T> {
  data: T;
  updatedAt: string;
}

const KAB_KOTA_KEY = "cache:kab-kota";
const todayKey = (cityId: string) => `cache:jadwal-today:${cityId}`;
const periodKey = (cityId: string, period: string) => `cache:jadwal-period:${cityId}:${period}`;

async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, updatedAt: new Date().toISOString() }));
  } catch {
    // Cache bersifat opsional; kegagalan tulis tidak boleh memblokir aplikasi.
  }
}

export const getCachedKabKota = () => readCache<KabKota[]>(KAB_KOTA_KEY);
export const saveCachedKabKota = (data: KabKota[]) => writeCache(KAB_KOTA_KEY, data);

export const getCachedJadwalToday = (cityId: string) => readCache<JadwalResponse>(todayKey(cityId));
export const saveCachedJadwalToday = (cityId: string, data: JadwalResponse) =>
  writeCache(todayKey(cityId), data);

export const getCachedJadwalPeriod = (cityId: string, period: string) =>
  readCache<JadwalResponse>(periodKey(cityId, period));
export const saveCachedJadwalPeriod = (cityId: string, period: string, data: JadwalResponse) =>
  writeCache(periodKey(cityId, period), data);
