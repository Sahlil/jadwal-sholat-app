import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, Redirect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorView } from "@/components/error-view";
import { LoadingView } from "@/components/loading-view";
import { PrayerCard } from "@/components/prayer-card";
import { Colors } from "@/constants/theme";
import { useMonthSchedule } from "@/hooks/use-schedule";
import type { JadwalSholat } from "@/types/sholat";
import { monthLabel, shiftMonthKey, toMonthKey, todayDateKey } from "@/utils/date";

interface DaySchedule {
  date: string;
  isToday: boolean;
  jadwal: JadwalSholat;
}

export default function JadwalBulananScreen() {
  const params = useLocalSearchParams<{ id?: string; lokasi?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const lokasi = typeof params.lokasi === "string" ? params.lokasi : "";

  const [month, setMonth] = useState(() => toMonthKey(new Date()));

  const { data, loading, error, refetch } = useMonthSchedule(id, month);

  if (!id) {
    return <Redirect href="/" />;
  }

  const days: DaySchedule[] = data
    ? Object.entries(data.jadwal)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, jadwal]) => ({ date, isToday: date === todayDateKey(), jadwal }))
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Jadwal Bulanan" }} />

      <View style={styles.subHeader}>
        <Text style={styles.cityName} numberOfLines={1}>
          {lokasi}
        </Text>
        <View style={styles.monthNavigator}>
          <Pressable
            style={styles.navButton}
            onPress={() => setMonth((m) => shiftMonthKey(m, -1))}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
          <Pressable
            style={styles.navButton}
            onPress={() => setMonth((m) => shiftMonthKey(m, 1))}
          >
            <Text style={styles.navButtonText}>›</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <LoadingView message="Memuat jadwal sebulan..." />
      ) : error || days.length === 0 ? (
        <ErrorView message={error ?? "Jadwal tidak ditemukan."} onRetry={refetch} />
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.dayCard, item.isToday && styles.dayCardToday]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayDate, item.isToday && styles.dayDateToday]}>
                  {item.jadwal.tanggal}
                </Text>
                {item.isToday ? <Text style={styles.todayBadge}>Hari Ini</Text> : null}
              </View>
              <PrayerCard jadwal={item.jadwal} highlightNext={item.isToday} dense />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  subHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  cityName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  monthNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  navButtonText: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
  monthLabel: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  dayCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.card,
    padding: 12,
    gap: 8,
  },
  dayCardToday: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayDate: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  dayDateToday: {
    color: Colors.primaryDark,
  },
  todayBadge: {
    backgroundColor: Colors.primary,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: "hidden",
  },
});
