import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, Redirect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorView } from "@/components/error-view";
import { PrayerCard } from "@/components/prayer-card";
import { DayListSkeleton } from "@/components/skeletons";
import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [month, setMonth] = useState(() => toMonthKey(new Date()));

  const { data, loading, error, refetch } = useMonthSchedule(id, month);

  const days = useMemo<DaySchedule[]>(
    () =>
      data
        ? Object.entries(data.jadwal)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, jadwal]) => ({ date, isToday: date === todayDateKey(), jadwal }))
        : [],
    [data],
  );

  const listRef = useRef<FlatList<DaySchedule>>(null);
  const todayIndex = useMemo(() => days.findIndex((d) => d.isToday), [days]);

  useEffect(() => {
    if (loading || todayIndex < 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: todayIndex, viewPosition: 0, animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [todayIndex, loading]);

  if (!id) {
    return <Redirect href="/" />;
  }

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
        <DayListSkeleton />
      ) : error || days.length === 0 ? (
        <ErrorView message={error ?? "Jadwal tidak ditemukan."} onRetry={refetch} />
      ) : (
        <FlatList
          ref={listRef}
          data={days}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({
              offset: Math.max(0, averageItemLength * index),
              animated: true,
            });
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index, viewPosition: 0, animated: true });
            }, 100);
          }}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    subHeader: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    cityName: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    monthNavigator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    navButton: {
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 6,
    },
    navButtonText: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: "700",
      lineHeight: 24,
    },
    monthLabel: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    listContent: {
      padding: 16,
      gap: 12,
    },
    dayCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.card,
      padding: 12,
      gap: 8,
    },
    dayCardToday: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dayDate: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    dayDateToday: {
      color: colors.primaryDark,
    },
    todayBadge: {
      backgroundColor: colors.primary,
      color: colors.onPrimary,
      fontSize: 11,
      fontWeight: "700",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
      overflow: "hidden",
    },
  });
