import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/skeleton";
import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";

const PRAYER_ROW_COUNT = 8;

/** Kerangka daftar kota (mirip baris `kota.tsx`). */
export function CityListSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.cityList}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={styles.cityRow}>
          <Skeleton width="72%" height={15} borderRadius={6} />
          <Skeleton width={16} height={16} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}

/** Kerangka satu kartu waktu sholat (mirip `PrayerCard`). */
export function PrayerCardSkeleton({ dense = false }: { dense?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.prayerCard, dense && styles.prayerCardDense]}>
      {Array.from({ length: PRAYER_ROW_COUNT }).map((_, i) => (
        <View key={i} style={styles.prayerRow}>
          <Skeleton width={dense ? 52 : 64} height={13} borderRadius={6} />
          <Skeleton width={dense ? 48 : 56} height={15} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

/** Kerangka daftar kartu harian pada jadwal bulanan (mirip `jadwal.tsx`). */
export function DayListSkeleton({ count = 3 }: { count?: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.dayList}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.dayCard}>
          <Skeleton width={110} height={13} borderRadius={6} />
          <PrayerCardSkeleton dense />
        </View>
      ))}
    </View>
  );
}

/** Kerangka beranda: header hijau + konten jadwal hari ini. */
export function HomeSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.home}>
      <View style={styles.header}>
        <Skeleton width={170} height={28} borderRadius={8} baseColor="rgba(255,255,255,0.3)" />
        <Skeleton width={120} height={32} borderRadius={999} baseColor="rgba(255,255,255,0.22)" />
      </View>
      <View style={styles.content}>
        <Skeleton width={150} height={18} borderRadius={6} style={styles.centered} />
        <Skeleton width={96} height={12} borderRadius={6} style={styles.centered} />
        <View style={styles.countdown}>
          <Skeleton width={210} height={16} borderRadius={6} style={styles.centered} />
          <Skeleton width={130} height={13} borderRadius={6} style={styles.centered} />
        </View>
        <PrayerCardSkeleton />
        <Skeleton width="100%" height={46} borderRadius={14} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    cityList: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 8,
    },
    cityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    prayerCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    prayerCardDense: {
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    prayerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    dayList: {
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
    home: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 8,
    },
    content: {
      flexGrow: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 12,
    },
    centered: {
      alignSelf: "center",
    },
    countdown: {
      gap: 8,
      paddingVertical: 12,
    },
  });
