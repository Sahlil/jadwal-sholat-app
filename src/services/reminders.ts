import * as Notifications from "expo-notifications";

import { toDateKey } from "@/utils/date";
import type {
  JadwalSholat,
  ReminderPrayerKey,
  ReminderSettings,
} from "@/types/sholat";
import { REMINDER_PRAYERS } from "@/types/sholat";
import { getJadwalRange } from "@/storage/schedule-repo";

/** Jumlah hari ke depan yang dijadwalkan dengan trigger DATE. */
export const REMINDER_WINDOW_DAYS = 30;

export const REMINDER_CHANNEL_ID = "reminders";

const REMINDER_LABELS: Record<ReminderPrayerKey, string> = {
  imsak: "Imsak",
  subuh: "Subuh",
  dhuha: "Dhuha",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};

/** Tampilkan banner + suara saat notif masuk dalam keadaan app foreground. */
export function setNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Buat channel Android "reminders" sebelum meminta izin (syarat Android 13). */
export async function setupChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Pengingat Sholat",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
}

export type ReminderPermissionStatus = "granted" | "denied" | "undetermined";

/** Periksa izin notifikasi tanpa prompt. */
export async function getPermissionAsync(): Promise<ReminderPermissionStatus> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return "granted";
  return settings.ios?.status === Notifications.IosAuthorizationStatus.NOT_DETERMINED
    ? "undetermined"
    : "denied";
}

/** Minta izin notifikasi; di Android channel harus dibuat dulu agar prompt muncul. */
export async function requestPermissionAsync(): Promise<ReminderPermissionStatus> {
  await setupChannel();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return "granted";
  const result = await Notifications.requestPermissionsAsync();
  return result.granted ? "granted" : "denied";
}

/** Ambil jadwal lokal dari database untuk rentang window (bekerja offline). */
async function fetchWindowSchedule(
  cityId: string,
  days: number,
): Promise<Map<string, JadwalSholat>> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);

  return getJadwalRange(cityId, toDateKey(start), toDateKey(end));
}

/**
 * Jadwalkan ulang pengingat untuk `REMINDER_WINDOW_DAYS` ke depan menggunakan
 * trigger DATE (bukan DAILY) agar akurat terhadap jadwal bulanan.
 */
export async function scheduleReminders(
  settings: ReminderSettings,
  cityId: string,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.enabled) return;

  const now = new Date();
  const schedule = await fetchWindowSchedule(cityId, REMINDER_WINDOW_DAYS);

  for (let i = 0; i < REMINDER_WINDOW_DAYS; i++) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + i);

    const jadwal = schedule.get(toDateKey(date));
    if (!jadwal) continue;

    for (const key of REMINDER_PRAYERS) {
      if (!settings.prayers[key]) continue;

      const [hour, minute] = jadwal[key].split(":").map(Number);
      let totalMinutes = hour * 60 + minute - settings.offsetMinutes;
      // Clamp ke rentang hari yang sama (preset 5–30 menit tidak menembus tengah malam).
      if (totalMinutes < 0) totalMinutes += 24 * 60;
      if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;

      const triggerDate = new Date(date);
      triggerDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

      // Skip waktu yang sudah lewat hari ini (trigger DATE tidak auto-defer).
      if (triggerDate.getTime() <= now.getTime()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Pengingat Sholat",
          body: `${REMINDER_LABELS[key]} dalam ${settings.offsetMinutes} menit.`,
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
    }
  }
}

/** Batalkan semua pengingat terjadwal. */
export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Sinkronkan pengingat dengan jadwal & kota terbaru.
 * Membatalkan yang lama lalu menjadwalkan ulang window 30 hari.
 */
export async function syncReminders(
  settings: ReminderSettings,
  cityId: string,
): Promise<{ scheduled: boolean }> {
  if (!settings.enabled) {
    await cancelReminders();
    return { scheduled: false };
  }
  await scheduleReminders(settings, cityId);
  return { scheduled: true };
}
