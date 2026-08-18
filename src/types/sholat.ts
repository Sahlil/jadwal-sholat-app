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

/** Kunci waktu sholat yang bisa diingatkan (7 waktu, tanpa Terbit). */
export type ReminderPrayerKey = Exclude<PrayerKey, "terbit">;

/** Konstanta 7 waktu pengingat, mengikuti urutan jadwal. */
export const REMINDER_PRAYERS: ReminderPrayerKey[] = [
  "imsak",
  "subuh",
  "dhuha",
  "dzuhur",
  "ashar",
  "maghrib",
  "isya",
];

export interface ReminderSettings {
  enabled: boolean;
  beforeEnabled: boolean;
  offsetMinutes: number;
  prayers: Record<ReminderPrayerKey, boolean>;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  beforeEnabled: true,
  offsetMinutes: 5,
  prayers: {
    imsak: true,
    subuh: true,
    dhuha: true,
    dzuhur: true,
    ashar: true,
    maghrib: true,
    isya: true,
  },
};
