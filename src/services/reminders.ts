import * as Notifications from "expo-notifications";

import { toDateKey } from "@/utils/date";
import type {
  JadwalSholat,
  ReminderPrayerKey,
  ReminderSettings,
} from "@/types/sholat";
import { REMINDER_PRAYERS } from "@/types/sholat";
import { getJadwalRange } from "@/storage/schedule-repo";

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
 * Jadwalkan ulang pengingat harian. Membatalkan semua notifikasi terjadwal
 * lebih dulu (mencegah penumpukan alarm) lalu menjadwalkan ulang notifikasi
 * DAILY per waktu sholat aktif — maksimal 14 notifikasi.
 *
 * Setiap waktu aktif selalu mendapat notifikasi saat waktu tiba (wajib);
 * notifikasi "sebelum" hanya bila `beforeEnabled` aktif (opsional).
 */
interface DailyReminder {
  hour: number;
  minute: number;
  body: string;
}

export async function scheduleReminders(
  settings: ReminderSettings,
  cityId: string,
): Promise<void> {
  if (!settings.enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  const schedule = await fetchWindowSchedule(cityId, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const jadwal = schedule.get(toDateKey(today));
  if (!jadwal) {
    throw new Error("Jadwal hari ini tidak tersedia untuk menjadwalkan pengingat.");
  }

  const desired: DailyReminder[] = [];
  for (const key of REMINDER_PRAYERS) {
    if (!settings.prayers[key]) continue;

    const [hour, minute] = jadwal[key].split(":").map(Number);
    const atTimeMinutes = hour * 60 + minute;

    // Wajib: notifikasi saat waktu tiba.
    desired.push({
      hour: Math.floor(atTimeMinutes / 60),
      minute: atTimeMinutes % 60,
      body: `Waktu ${REMINDER_LABELS[key]} telah tiba.`,
    });

    // Opsional: notifikasi sebelum waktu.
    if (settings.beforeEnabled) {
      const beforeMinutes = (atTimeMinutes - settings.offsetMinutes + 24 * 60) % (24 * 60);
      desired.push({
        hour: Math.floor(beforeMinutes / 60),
        minute: beforeMinutes % 60,
        body: `${REMINDER_LABELS[key]} dalam ${settings.offsetMinutes} menit.`,
      });
    }
  }

  // Hindari churn: jika jadwal terjadwal sudah identik, lewati batal+jadwal ulang.
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const existingSet = new Set(
    existing
      .map((n) => {
        const t = n.trigger as
          | { type?: unknown; hour?: number; minute?: number }
          | undefined;
        if (t?.type !== Notifications.SchedulableTriggerInputTypes.DAILY) return null;
        return `${t.hour}:${t.minute}`;
      })
      .filter((v): v is string => v !== null),
  );
  const desiredSet = new Set(desired.map((d) => `${d.hour}:${d.minute}`));
  if (
    existingSet.size === desiredSet.size &&
    [...desiredSet].every((v) => existingSet.has(v))
  ) {
    console.log(`[Reminders] penjadwalan sudah up-to-date (${desiredSet.size} notif) — dilewati.`);
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const scheduleDaily = async (d: DailyReminder): Promise<string> => {
    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: d.hour,
      minute: d.minute,
      channelId: REMINDER_CHANNEL_ID,
    };
    const expectedAt = await Notifications.getNextTriggerDateAsync(trigger) ?? Date.now();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Pengingat Sholat",
        body: d.body,
        sound: true,
        data: { expectedAt },
      },
      trigger,
    });
    console.log(
      `[Reminders] terjadwal id=${id} body="${d.body}" expectedAt=${new Date(expectedAt).toISOString()}`,
    );
    return id;
  };

  for (const d of desired) {
    await scheduleDaily(d);
  }
}

/** Batalkan semua pengingat terjadwal. */
export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Sinkronkan pengingat dengan jadwal & kota terbaru.
 * Membatalkan yang lama lalu menjadwalkan ulang notifikasi harian.
 *
 * Serialized (single-flight): panggilan yang tumpang tindih diantrekan agar
 * tidak saling menyeling dan menyebabkan notifikasi dobel/terduplikasi.
 */
let syncChain: Promise<unknown> = Promise.resolve();

export function syncReminders(
  settings: ReminderSettings,
  cityId: string,
): Promise<{ scheduled: boolean }> {
  const run = syncChain.then(async () => {
    if (!settings.enabled) {
      await cancelReminders();
      return { scheduled: false };
    }
    await scheduleReminders(settings, cityId);
    return { scheduled: true };
  });
  syncChain = run.catch(() => {});
  return run;
}
