import { useCallback, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { requestWidgetUpdate } from "react-native-android-widget";
import { SafeAreaView } from "react-native-safe-area-context";

import { getJadwalToday } from "@/api/sholat";
import { ErrorView } from "@/components/error-view";
import { LoadingView } from "@/components/loading-view";
import { PrayerCard } from "@/components/prayer-card";
import { Colors } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useSelectedCity } from "@/hooks/use-selected-city";
import { getCachedJadwalToday, saveCachedJadwalToday } from "@/storage/cache";
import type { KabKota } from "@/types/sholat";
import { JadwalSholatWidget, WIDGET_NAME } from "@/widgets/jadwal-sholat-widget";

export default function HomeScreen() {
  const city = useSelectedCity();

  if (!city) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <LoadingView message="Memuat kota pilihan..." />
      </SafeAreaView>
    );
  }

  return <HomeContent city={city} />;
}

function HomeContent({ city }: { city: KabKota }) {
  const fetcher = useCallback(async () => {
    try {
      const fresh = await getJadwalToday(city.id);
      await saveCachedJadwalToday(city.id, fresh);
      return fresh;
    } catch (err) {
      const cached = await getCachedJadwalToday(city.id);
      if (cached) return cached.data;
      throw err;
    }
  }, [city.id]);
  const { data, loading, error, refetch } = useApi(fetcher);

  const jadwal = data?.jadwal;
  const jadwalToday = jadwal ? Object.values(jadwal)[0] : null;

  // Sinkronkan jadwal terbaru ke widget Android setelah data berhasil dimuat.
  useEffect(() => {
    if (!data || !jadwalToday) return;

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
  }, [data, city, jadwalToday]);

  const openCityPicker = () => router.push("/kota");
  const openMonthlySchedule = () =>
    router.push({ pathname: "/jadwal", params: { id: city.id, lokasi: city.lokasi } });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.brand}>Jadwal Sholat</Text>
        <Pressable style={styles.cityButton} onPress={openCityPicker}>
          <Text style={styles.cityButtonText} numberOfLines={1}>
            {city.lokasi}  ▾
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingView message="Menyelaraskan jadwal waktu setempat..." />
      ) : error || !jadwalToday ? (
        <ErrorView message={error ?? "Jadwal tidak ditemukan."} onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.date}>{jadwalToday.tanggal}</Text>
          {data?.prov ? <Text style={styles.prov}>{data.prov}</Text> : null}

          <PrayerCard jadwal={jadwalToday} highlightNext />

          <Pressable style={styles.monthlyButton} onPress={openMonthlySchedule}>
            <Text style={styles.monthlyButtonText}>Lihat Jadwal Bulanan</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 8,
  },
  brand: {
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  date: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  prov: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  monthlyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  monthlyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
