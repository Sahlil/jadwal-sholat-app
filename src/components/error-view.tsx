import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Coba Lagi</Text>
        </Pressable>
      ) : null}
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
    icon: {
      fontSize: 32,
    },
    message: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
    button: {
      marginTop: 4,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
  });