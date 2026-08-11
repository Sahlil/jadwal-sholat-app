import { StyleSheet, Text, View } from "react-native";

import { PRAYER_ORDER, Colors } from "@/constants/theme";
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderBottomColor: Colors.background,
  },
  rowNext: {
    backgroundColor: "#ECFDF5",
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
  labelNext: {
    color: Colors.primaryDark,
    fontWeight: "600",
  },
  badge: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  time: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  timeNext: {
    color: Colors.primary,
  },
});
