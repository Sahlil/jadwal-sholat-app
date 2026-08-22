import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PRAYER_ORDER } from "@/constants/theme";
import type { ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme";
import type { JadwalSholat, PrayerKey } from "@/types/sholat";
import { getNextPrayerDate } from "@/utils/date";

const PRAYER_LABELS = Object.fromEntries(
  PRAYER_ORDER.map(({ key, label }) => [key, label]),
) as Record<PrayerKey, string>;

const pad = (value: number) => String(value).padStart(2, "0");

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Hitung mundur menuju waktu sholat berikutnya — teks, tanpa card. */
export function CountdownTimer({ jadwal }: { jadwal: JadwalSholat }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { key, date } = useMemo(() => getNextPrayerDate(jadwal, now), [jadwal, now]);
  const remaining = date.getTime() - now.getTime();

  return (
    <Text style={styles.text}>
      {PRAYER_LABELS[key]} dalam{" "}
      <Text style={styles.time}>{formatDuration(remaining)}</Text>
    </Text>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    text: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
    },
    time: {
      color: colors.accent,
      fontWeight: "800",
    },
  });
