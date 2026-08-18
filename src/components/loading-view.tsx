import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";

export function LoadingView({ message = "Memuat data..." }: { message?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 24,
    },
    text: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
    },
  });