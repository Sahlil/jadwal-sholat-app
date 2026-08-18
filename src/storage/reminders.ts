import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
} from "@/types/sholat";

const REMINDERS_KEY = "reminder-settings";

/** Pengaturan pengingat yang tersimpan, atau nilai default bila belum ada. */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    if (!raw) return DEFAULT_REMINDER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      enabled: parsed.enabled ?? DEFAULT_REMINDER_SETTINGS.enabled,
      beforeEnabled:
        parsed.beforeEnabled ?? DEFAULT_REMINDER_SETTINGS.beforeEnabled,
      offsetMinutes:
        parsed.offsetMinutes ?? DEFAULT_REMINDER_SETTINGS.offsetMinutes,
      prayers: {
        ...DEFAULT_REMINDER_SETTINGS.prayers,
        ...(parsed.prayers ?? {}),
      },
    };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(
  settings: ReminderSettings,
): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(settings));
  } catch {
    // Penyimpanan gagal (mis. storage penuh) — abaikan, tidak kritis.
  }
}
