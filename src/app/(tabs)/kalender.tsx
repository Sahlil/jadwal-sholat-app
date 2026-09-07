import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ErrorView } from "@/components/error-view";
import { LoadingView } from "@/components/loading-view";
import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";
import { useHijriMonth } from "@/hooks/use-hijri";
import type { HijriDate } from "@/types/hijri";
import { monthLabel, shiftMonthKey, toMonthKey, todayDateKey } from "@/utils/date";
import { formatHijri, HIJRI_MONTHS_ID, hijriMonthLabel } from "@/utils/hijri";

const DAY_HEADERS = ["A", "S", "S", "R", "K", "J", "P"];

interface Cell {
  dateKey: string;
  gregorianDay: number;
  hijri: HijriDate;
  isToday: boolean;
  isNewHijriMonth: boolean;
  hasHoliday: boolean;
}

export default function KalenderScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { data, loading, error, refetch } = useHijriMonth(month);
  const today = todayDateKey();

  const cells = useMemo<Cell[]>(() => {
    if (!data) return [];
    const [year, monthNumber] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();

    const result: Cell[] = [];
    let prevHijriMonth: number | null = null;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${month}-${String(day).padStart(2, "0")}`;
      const raw = data[dateKey];
      if (!raw) continue;
      const hijri: HijriDate = {
        ...raw,
        // Cache lama (sebelum fitur holiday) tidak punya field ini.
        holidays: raw.holidays ?? [],
      };
      result.push({
        dateKey,
        gregorianDay: day,
        hijri,
        isToday: dateKey === today,
        isNewHijriMonth: prevHijriMonth !== null && hijri.month !== prevHijriMonth,
        hasHoliday: hijri.holidays.length > 0,
      });
      prevHijriMonth = hijri.month;
    }
    return result;
  }, [data, month, today]);

  const leadingBlanks = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    return new Date(year, monthNumber - 1, 1).getDay();
  }, [month]);

  const hijriTitle = useMemo(() => hijriMonthLabel(cells.map((c) => c.hijri)), [cells]);
  const newMonthNames = useMemo(
    () =>
      cells
        .filter((c) => c.isNewHijriMonth)
        .map((c) => HIJRI_MONTHS_ID[c.hijri.month - 1])
        .filter((name, i, arr) => arr.indexOf(name) === i),
    [cells],
  );
  const selectedCell = useMemo(
    () => cells.find((c) => c.dateKey === selectedKey) ?? null,
    [cells, selectedKey],
  );

  return (
    <View style={styles.container}>
      <View style={styles.monthNavigator}>
        <Pressable style={styles.navButton} onPress={() => setMonth((m) => shiftMonthKey(m, -1))}>
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>
        <View style={styles.monthLabels}>
          <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
          <Text style={styles.hijriLabel}>{hijriTitle}</Text>
        </View>
        <Pressable style={styles.navButton} onPress={() => setMonth((m) => shiftMonthKey(m, 1))}>
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingView message="Memuat kalender..." />
      ) : error || cells.length === 0 ? (
        <ErrorView message={error ?? "Kalender tidak tersedia."} onRetry={refetch} />
      ) : (
        <>
          <View style={styles.grid}>
            {DAY_HEADERS.map((d, i) => (
              <Text key={`h-${i}`} style={styles.dayHeader}>
                {d}
              </Text>
            ))}
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <View key={`b-${i}`} />
            ))}
            {cells.map((cell) => (
              <Pressable
                key={cell.dateKey}
                style={[
                  styles.cell,
                  cell.isNewHijriMonth && !cell.isToday && styles.cellNewMonth,
                  cell.isToday && styles.cellToday,
                ]}
                onPress={() =>
                  setSelectedKey((k) => (k === cell.dateKey ? null : cell.dateKey))
                }
              >
                <Text
                  style={[
                    styles.gregorianDay,
                    cell.isToday
                      ? styles.cellTextToday
                      : cell.isNewHijriMonth && styles.cellTextStrong,
                  ]}
                >
                  {cell.gregorianDay}
                </Text>
                <Text
                  style={[
                    styles.hijriDay,
                    cell.isToday
                      ? styles.cellTextToday
                      : cell.isNewHijriMonth && styles.cellTextStrong,
                  ]}
                >
                  {cell.hijri.day}
                </Text>
                <View style={[styles.dotSlot, cell.hasHoliday && styles.dotHoliday]} />
              </Pressable>
            ))}
          </View>

          <View style={styles.legend}>
            {newMonthNames.map((name) => (
              <View key={name} style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.legendOutline]} />
                <Text style={styles.legendText}>Awal bulan {name}</Text>
              </View>
            ))}
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Ada perayaan</Text>
            </View>
            <View style={styles.legendNote}>
              <Text style={styles.legendNoteText}>* Tanggal hijriyah berganti di Maghrib</Text>
            </View>
          </View>

          {selectedCell ? (
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>{formatHijri(selectedCell.hijri)}</Text>
              {selectedCell.hasHoliday ? (
                selectedCell.hijri.holidays.map((h) => (
                  <Text key={h} style={styles.detailHoliday}>
                    • {h}
                  </Text>
                ))
              ) : (
                <Text style={styles.detailEmpty}>Tidak ada perayaan.</Text>
              )}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      gap: 12,
    },
    monthNavigator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    navButton: {
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    navButtonText: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: "700",
      lineHeight: 26,
    },
    monthLabels: {
      alignItems: "center",
      gap: 2,
    },
    monthLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    hijriLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 8,
    },
    dayHeader: {
      width: `${100 / 7}%`,
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      paddingVertical: 6,
    },
    cell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    cellNewMonth: {
      borderColor: colors.primaryDark,
    },
    cellToday: {
      backgroundColor: colors.primary,
    },
    gregorianDay: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
    },
    hijriDay: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    cellTextStrong: {
      color: colors.primaryDark,
    },
    cellTextToday: {
      color: colors.onPrimary,
    },
    dotSlot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: "transparent",
    },
    dotHoliday: {
      backgroundColor: colors.accent,
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 4,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendSwatch: {
      width: 16,
      height: 16,
      borderRadius: 5,
    },
    legendOutline: {
      borderWidth: 1.5,
      borderColor: colors.primaryDark,
    },
    legendDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    legendText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    legendNote: {
      marginTop: 8,
      paddingHorizontal: 4,
    },
    legendNoteText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontStyle: "italic",
    },
    detailCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      gap: 6,
    },
    detailTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    detailHoliday: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    detailEmpty: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
