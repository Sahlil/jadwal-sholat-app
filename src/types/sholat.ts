export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface KabKota {
  id: string;
  lokasi: string;
}

export type PrayerKey =
  | "imsak"
  | "subuh"
  | "terbit"
  | "dhuha"
  | "dzuhur"
  | "ashar"
  | "maghrib"
  | "isya";

export interface JadwalSholat {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export interface JadwalResponse {
  id: string;
  kabko: string;
  prov: string;
  jadwal: Record<string, JadwalSholat>;
}
