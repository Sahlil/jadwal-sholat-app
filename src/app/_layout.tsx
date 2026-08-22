import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider, useTheme } from "@/contexts/theme";
import { setNotificationHandler, setupChannel } from "@/services/reminders";
import {
  getExactAlarmStatus,
  startReminderDiagnostics,
} from "@/services/reminder-diagnostics";

function RootNavigator() {
  const { colors, mode } = useTheme();

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    try {
      setNotificationHandler();
      startReminderDiagnostics();
      getExactAlarmStatus();
    } catch (error) {
      console.error("[Startup] inisialisasi notifikasi gagal:", error);
    }
    setupChannel().catch((error) => {
      console.error("[Startup] channel notifikasi gagal:", error);
    });
  }, []);

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Aplikasi mengalami gangguan</Text>
      <Text style={styles.errorMessage}>{error.message || "Terjadi kesalahan tak terduga."}</Text>
      <Pressable style={styles.errorButton} onPress={() => void retry()}>
        <Text style={styles.errorButtonText}>Coba Lagi</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: { color: "#0F172A", fontSize: 20, fontWeight: "700" },
  errorMessage: { color: "#475569", textAlign: "center" },
  errorButton: { backgroundColor: "#0F766E", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  errorButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
