import { useEffect, useMemo } from "react";
import { InteractionManager, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { requestWidgetUpdate } from "react-native-android-widget";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorView } from "@/components/error-view";
import { PrayerCard } from "@/components/prayer-card";
import { HomeSkeleton } from "@/components/skeletons";
import { CountdownTimer } from "@/components/countdown-timer";
import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";
import { useSelectedCity } from "@/hooks/use-selected-city";
import { useTodaySchedule } from "@/hooks/use-schedule";
import { getReminderSettings } from "@/storage/reminders";
import { syncReminders } from "@/services/reminders";
import type { KabKota } from "@/types/sholat";
import { JadwalSholatWidget, WIDGET_NAME } from "@/widgets/jadwal-sholat-widget";

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const city = useSelectedCity();

  if (!city) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  return <HomeContent city={city} />;
}

function HomeContent({ city }: { city: KabKota }) {
  const { data, loading, error, refetch } = useTodaySchedule(city.id);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const jadwal = data?.jadwal;
  const jadwalToday = jadwal ? Object.values(jadwal)[0] : null;

  // Sinkronkan jadwal terbaru ke widget Android setelah data berhasil dimuat.
  useEffect(() => {
    if (!data || !jadwalToday) return;

    const task = InteractionManager.runAfterInteractions(() => {
      requestWidgetUpdate({
        widgetName: WIDGET_NAME,
        renderWidget: () => (
          <JadwalSholatWidget
            cityName={city.lokasi}
            tanggal={jadwalToday.tanggal}
            times={jadwalToday}
          />
        ),
      }).catch(() => {
        // Widget belum ditambahkan di home screen — tidak perlu ditindaklanjuti.
      });
    });
    return () => task.cancel();
  }, [data, city.lokasi, jadwalToday]);

  const openCityPicker = () => router.push("/kota");
  const openMonthlySchedule = () =>
    router.push({ pathname: "/jadwal", params: { id: city.id, lokasi: city.lokasi } });

  // Sinkronkan pengingat dengan jadwal & kota terbaru bila pengingat aktif.
  useEffect(() => {
    if (!data) return;

    const task = InteractionManager.runAfterInteractions(() => {
      getReminderSettings().then((settings) => {
        syncReminders(settings, city.id).catch((err) => {
          console.error("[Reminders] sinkron gagal:", err);
        });
      });
    });
    return () => task.cancel();
  }, [data, city.id]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.brand}>Jadwal Sholat</Text>
        <Pressable style={styles.cityButton} onPress={openCityPicker}>
          <Text style={styles.cityButtonText} numberOfLines={1}>
            {city.lokasi}  ▾
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <HomeSkeleton />
      ) : error || !jadwalToday ? (
        <ErrorView message={error ?? "Jadwal tidak ditemukan."} onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.date}>{jadwalToday.tanggal}</Text>
          {data?.prov ? <Text style={styles.prov}>{data.prov}</Text> : null}

          <CountdownTimer jadwal={jadwalToday} />

          <PrayerCard jadwal={jadwalToday} highlightNext />

          <Pressable style={styles.monthlyButton} onPress={openMonthlySchedule}>
            <Text style={styles.monthlyButtonText}>Lihat Jadwal Bulanan</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 8,
    },
    brand: {
      color: colors.onPrimary,
      fontSize: 28,
      fontWeight: "800",
    },
    cityButton: {
      alignSelf: "flex-start",
      maxWidth: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    cityButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    content: {
      flexGrow: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 12,
    },
    suggestion: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
      padding: 14,
    },
    suggestionText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    suggestionCity: {
      fontWeight: "700",
    },
    suggestionActions: {
      flexDirection: "row",
      gap: 8,
    },
    suggestionApply: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: 10,
      flex: 1,
      paddingVertical: 10,
    },
    suggestionApplyText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    suggestionDismiss: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    suggestionDismissText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    date: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
    },
    prov: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: "center",
      marginBottom: 8,
    },
    monthlyButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    monthlyButtonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
