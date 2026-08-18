import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Stack } from "expo-router";

import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";
import { useSelectedCity } from "@/hooks/use-selected-city";
import {
  getPermissionAsync,
  requestPermissionAsync,
  syncReminders,
  type ReminderPermissionStatus,
} from "@/services/reminders";
import { getReminderSettings, saveReminderSettings } from "@/storage/reminders";
import { logScheduled, scheduleTestNotification } from "@/services/reminder-diagnostics";
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
          if (next.enabled) {
            logScheduled().catch(() => {});
          }
        }
      } finally {
        setBusy(false);
      }
    },
    [city],
  );

  const toggleEnabled = (value: boolean) => apply({ ...settings, enabled: value });
  const toggleBefore = (value: boolean) => apply({ ...settings, beforeEnabled: value });
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
              <Text style={styles.rowSubtitle}>
                Notifikasi saat waktu sholat tiba (selalu aktif untuk waktu yang dipilih)
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleEnabled}
              disabled={busy}
              trackColor={{ true: colors.primary, false: colors.border }}
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

        {settings.enabled ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Pengingat sebelum (opsional)</Text>
                <Text style={styles.rowSubtitle}>
                  Notifikasi tambahan beberapa menit sebelum waktu sholat
                </Text>
              </View>
              <Switch
                value={settings.beforeEnabled}
                onValueChange={toggleBefore}
                disabled={busy}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
            {settings.beforeEnabled ? (
              <>
                <Text style={styles.offsetHint}>Kapan notifikasi &quot;sebelum&quot; dikirim</Text>
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
              </>
            ) : null}
          </View>
        ) : null}

        {settings.enabled ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Waktu yang diingatkan</Text>
            {REMINDER_PRAYERS.map((key) => (
              <View key={key} style={styles.row}>
                <Text style={styles.rowTitle}>{PRAYER_LABELS[key]}</Text>
                <Switch
                  value={settings.prayers[key]}
                  onValueChange={(value) => togglePrayer(key, value)}
                  disabled={busy}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>
            ))}
          </View>
        ) : null}

        {/* Diagnostik uji coba notifikasi (dinonaktifkan).
        <View style={styles.card}>
          <Text style={styles.rowTitle}>Diagnostik</Text>
          <Text style={styles.rowSubtitle}>
            Uji kirim 1 notifikasi ~60 detik lagi dan lihat delay di log/console.
          </Text>
          <Text
            style={styles.link}
            onPress={() => {
              scheduleTestNotification().catch((e) => console.error(e));
              logScheduled().catch(() => {});
            }}
          >
            Kirim Notifikasi Uji
          </Text>
        </View>
        */}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
      gap: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
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
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    rowSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    offsetHint: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
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
      borderColor: colors.border,
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      overflow: "hidden",
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      color: colors.onPrimary,
    },
    notice: {
      color: colors.danger,
      fontSize: 13,
    },
    link: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 4,
    },
  });
