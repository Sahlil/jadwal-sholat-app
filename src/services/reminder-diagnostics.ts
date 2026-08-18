import * as Notifications from "expo-notifications";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform, Settings } from "react-native";

import { REMINDER_CHANNEL_ID } from "@/services/reminders";

const TAG = "[ReminderDiag]";

/**
 * Mulai memantau pengiriman notifikasi pengingat untuk mengukur delay.
 *
 * Keterbatasan: listener JS hanya aktif saat app hidup di foreground/background,
 * bukan saat app di-force-stop. Untuk pengukuran, biarkan app terbuka.
 */
export function startReminderDiagnostics(): void {
  Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as { expectedAt?: number } | undefined;
    const receivedAt = Date.now();
    const expectedAt = data?.expectedAt;
    const body = notification.request.content.body ?? "";

    if (typeof expectedAt === "number") {
      const delayMs = receivedAt - expectedAt;
      console.log(
        `${TAG} terkirim body="${body}" expectedAt=${new Date(expectedAt).toISOString()} ` +
          `receivedAt=${new Date(receivedAt).toISOString()} delayMs=${delayMs} delaySec=${(delayMs / 1000).toFixed(1)}`,
      );
    } else {
      console.log(`${TAG} terkirim (tanpa expectedAt) body="${body}" receivedAt=${receivedAt}`);
    }
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as
      | { expectedAt?: number }
      | undefined;
    console.log(
      `${TAG} diketuk body="${response.notification.request.content.body ?? ""}" ` +
        `delayFromExpectedMs=${typeof data?.expectedAt === "number" ? Date.now() - data.expectedAt : "n/a"}`,
    );
  });
}

/** Log daftar notifikasi yang sedang terjadwal + status izin. */
export async function logScheduled(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(
    `${TAG} terjadwal=${scheduled.length} ` +
      scheduled
        .map(
          (n) =>
            `${n.content.body} @${"trigger" in n && "date" in (n.trigger as object) ? String((n.trigger as { date?: unknown }).date) : n.identifier}`,
        )
        .join(" | "),
  );
  console.log(`${TAG} izinNotifikasi=${await Notifications.getPermissionsAsync().then((s) => JSON.stringify(s))}`);
}

/**
 * Status izin exact alarm (Android). Mengembalikan null bila tidak dapat
 * dibaca (mis. di iOS atau API tidak tersedia).
 */
export function getExactAlarmStatus(): boolean | null {
  if (Platform.OS !== "android") return null;
  try {
    const settings = Settings as unknown as { canScheduleExactAlarms?: () => boolean };
    if (typeof settings.canScheduleExactAlarms === "function") {
      const ok = settings.canScheduleExactAlarms();
      console.log(`${TAG} exactAlarmGranted=${ok}`);
      return ok;
    }
  } catch (e) {
    console.log(`${TAG} exactAlarm status gagal dibaca`, e);
  }
  console.log(`${TAG} exactAlarm status tidak tersedia (API tidak ada)`);
  return null;
}

/**
 * Pastikan izin exact alarm tersedia (Android 14+). Membuka prompt sistem
 * bila belum diberikan. Aman dipanggil tanpa await pada non-Android.
 */
export async function ensureExactAlarmPermission(): Promise<void> {
  if (Platform.OS !== "android") return;
  const granted = getExactAlarmStatus();
  if (granted) return;
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM,
    );
    console.log(`${TAG} prompt izin exact alarm dibuka`);
  } catch (e) {
    console.log(`${TAG} gagal membuka prompt exact alarm`, e);
  }
}

/** Jadwalkan 1 notifikasi uji ~60 detik lagi untuk mengukur delay. */
export async function scheduleTestNotification(): Promise<string> {
  const expectedAt = Date.now() + 60_000;
  const trigger: Notifications.NotificationTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(expectedAt),
    channelId: REMINDER_CHANNEL_ID,
  };
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Uji Pengingat Sholat",
      body: "Notifikasi uji (delay terukur di console).",
      sound: true,
      data: { expectedAt },
    },
    trigger,
  });
  console.log(
    `${TAG} uji terjadwal id=${id} expectedAt=${new Date(expectedAt).toISOString()} (dalam 60 detik)`,
  );
  return id;
}