import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PRAYER_ORDER } from "@/constants/theme";
import type { ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme";
import { getNextPrayerKey } from "@/utils/date";
import type { JadwalSholat } from "@/types/sholat";

interface PrayerCardProps {
  jadwal: JadwalSholat;
  /** Tandai waktu sholat berikutnya (hanya bermakna untuk jadwal hari ini). */
  highlightNext?: boolean;
  /** Mode ringkas untuk daftar harian. */
  dense?: boolean;
}

export function PrayerCard({ jadwal, highlightNext = false, dense = false }: PrayerCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const nextKey = highlightNext ? getNextPrayerKey(jadwal, new Date()) : null;

  return (
    <View style={[styles.card, dense && styles.cardDense]}>
      {PRAYER_ORDER.map(({ key, label }) => {
        const isNext = key === nextKey;

        return (
          <View
            key={key}
            style={[
              styles.row,
              !dense && styles.rowSpaced,
              isNext && styles.rowNext,
            ]}
          >
            <Text style={[styles.label, isNext && styles.labelNext]}>{label}</Text>
            {isNext ? <Text style={styles.badge}>Berikutnya</Text> : null}
            <Text style={[styles.time, isNext && styles.timeNext]}>{jadwal[key]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardDense: {
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    rowSpaced: {
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
    },
    rowNext: {
      backgroundColor: colors.highlight,
      marginHorizontal: -20,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "500",
    },
    labelNext: {
      color: colors.accent,
      fontWeight: "600",
    },
    badge: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    time: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    timeNext: {
      color: colors.accent,
    },
  });