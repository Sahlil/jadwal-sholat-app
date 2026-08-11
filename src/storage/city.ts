import AsyncStorage from "@react-native-async-storage/async-storage";

import type { KabKota } from "@/types/sholat";

const CITY_KEY = "selected-city";

/** Kota terakhir yang dipilih user, dipakai juga oleh widget. */
export async function getSelectedCity(): Promise<KabKota | null> {
  try {
    const raw = await AsyncStorage.getItem(CITY_KEY);
    return raw ? (JSON.parse(raw) as KabKota) : null;
  } catch {
    return null;
  }
}

export async function saveSelectedCity(city: KabKota): Promise<void> {
  try {
    await AsyncStorage.setItem(CITY_KEY, JSON.stringify(city));
  } catch {
    // Penyimpanan gagal (mis. storage penuh) — abaikan, tidak kritis.
  }
}
