import { useCallback, useState } from "react";
import * as Location from "expo-location";

import CITY_COORDS from "@/data/city-coordinates.json";
import type { KabKota } from "@/types/sholat";

export interface LocatedCity extends KabKota {
  /** Jarak dari posisi GPS ke titik pusat kota (km). */
  distanceKm: number;
}

export type LocationStatus =
  | { state: "idle" }
  | { state: "detecting" }
  | { state: "success"; city: LocatedCity }
  | { state: "error"; message: string };

/** Radius toleransi jarak dari titik pusat kota agar deteksi dianggap akurat. */
export const MAX_DISTANCE_KM = 120;

/** Jarak haversine antara dua koordinat (km). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Kota terdekat dari koordinat, dihitung dari tabel koordinat lokal. */
export function nearestCity(lat: number, lon: number): LocatedCity | null {
  let best: LocatedCity | null = null;
  for (const city of CITY_COORDS) {
    const distanceKm = haversineKm(lat, lon, city.lat, city.lon);
    if (!best || distanceKm < best.distanceKm) {
      best = { id: city.id, lokasi: city.lokasi, lat: city.lat, lon: city.lon, distanceKm };
    }
  }
  return best;
}

/** Deteksi kota tanpa mengubah state UI; kegagalan dianggap tidak ada hasil. */
export async function detectCity(): Promise<LocatedCity | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const city = nearestCity(position.coords.latitude, position.coords.longitude);
    return city && city.distanceKm <= MAX_DISTANCE_KM ? city : null;
  } catch {
    return null;
  }
}

/**
 * Deteksi kota berdasarkan posisi GPS user.
 * Mengembalikan status idle/detecting/success/error, bukan state kota aktif,
 * agar layar bisa meminta konfirmasi sebelum menyimpan.
 */
export function useLocationCity() {
  const [status, setStatus] = useState<LocationStatus>({ state: "idle" });

  const detect = useCallback(async () => {
    setStatus({ state: "detecting" });

    try {
      const city = await detectCity();
      if (!city) {
        setStatus({
          state: "error",
          message:
            "Lokasi tidak dapat dipetakan. Pastikan izin lokasi dan GPS aktif, lalu pilih kota secara manual bila perlu.",
        });
        return;
      }

      setStatus({ state: "success", city });
    } catch {
      setStatus({
        state: "error",
        message: "Gagal mendapatkan lokasi. Pastikan GPS aktif lalu coba lagi.",
      });
    }
  }, []);

  const reset = useCallback(() => setStatus({ state: "idle" }), []);

  return { status, detect, reset };
}
