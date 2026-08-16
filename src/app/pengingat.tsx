import { useCallback, useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Stack } from "expo-router";

import { Colors } from "@/constants/theme";
import { useSelectedCity } from "@/hooks/use-selected-city";
import {
  getPermissionAsync,
  requestPermissionAsync,
  syncReminders,
  type ReminderPermissionStatus,
} from "@/services/reminders";
import { getReminderSettings, saveReminderSettings } from "@/storage/reminders";
import {
  DEFAULT_REMINDER_SETTINGS,
  REMINDER_PRAYERS,
  type ReminderSettings,
} from "@/types/sholat";

const OFFSET_PRESETS = [5, 10, 15, 30];

const PRAYER_LABELS: Record<(typeof REMINDER_PRAYERS)[number], string> = {
  imsak: "Imsak",
  subuh: "Subuh",
  dhuha: "Dhuha",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};

export default function PengingatScreen() {
  const city = useSelectedCity();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [permission, setPermission] = useState<ReminderPermissionStatus>("undetermined");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getReminderSettings().then((saved) => {
      if (!active) return;
      setSettings(saved);
      setLoaded(true);
    });
    getPermissionAsync().then((status) => {
      if (active) setPermission(status);
    });
    return () => {
      active = false;
    };
  }, []);

  const apply = useCallback(
    async (next: ReminderSettings) => {
      setSettings(next);
      setBusy(true);
      setNotice(null);
      try {
        if (next.enabled) {
          let status = await getPermissionAsync();
          if (status !== "granted") {
            status = await requestPermissionAsync();
            setPermission(status);
          }
          if (status !== "granted") {
            const disabled = { ...next, enabled: false };
            setSettings(disabled);
            await saveReminderSettings(disabled);
            setNotice(
              "Izin notifikasi ditolak. Aktifkan izin di Pengaturan untuk menerima pengingat.",
            );
            return;
          }
        }
        await saveReminderSettings(next);
        if (city) {
          await syncReminders(next, city.id);
        }
      } finally {
        setBusy(false);
      }
    },
    [city],
  );

  const toggleEnabled = (value: boolean) => apply({ ...settings, enabled: value });
  const setOffset = (offsetMinutes: number) => apply({ ...settings, offsetMinutes });
  const togglePrayer = (key: (typeof REMINDER_PRAYERS)[number], value: boolean) =>
    apply({ ...settings, prayers: { ...settings.prayers, [key]: value } });

  if (!loaded) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Pengingat Sholat" }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Aktifkan Pengingat</Text>
              <Text style={styles.rowSubtitle}>Notifikasi sebelum waktu sholat</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleEnabled}
              disabled={busy}
              trackColor={{ true: Colors.primary, false: Colors.border }}
            />
          </View>
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        {permission === "denied" && !settings.enabled ? (
          <View style={styles.card}>
            <Text style={styles.rowTitle}>Izin notifikasi nonaktif</Text>
            <Text style={styles.rowSubtitle}>
              Buka Pengaturan untuk mengizinkan notifikasi dari aplikasi ini.
            </Text>
            <Text style={styles.link} onPress={() => Linking.openSettings()}>
              Buka Pengaturan
            </Text>
          </View>
        ) : null}

        <View style={[styles.card, !settings.enabled && styles.cardDisabled]}>
          <Text style={styles.sectionTitle}>Pengingat sebelum</Text>
          <View style={styles.offsetRow}>
            {OFFSET_PRESETS.map((value) => {
              const active = settings.offsetMinutes === value;
              return (
                <Text
                  key={value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setOffset(value)}
                >
                  {value} mnt
                </Text>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, !settings.enabled && styles.cardDisabled]}>
          <Text style={styles.sectionTitle}>Waktu yang diingatkan</Text>
          {REMINDER_PRAYERS.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowTitle}>{PRAYER_LABELS[key]}</Text>
              <Switch
                value={settings.prayers[key]}
                onValueChange={(value) => togglePrayer(key, value)}
                disabled={busy || !settings.enabled}
                trackColor={{ true: Colors.primary, false: Colors.border }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  offsetRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    overflow: "hidden",
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    color: "#FFFFFF",
  },
  notice: {
    color: Colors.danger,
    fontSize: 13,
  },
  link: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
});
