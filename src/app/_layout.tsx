import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider, useTheme } from "@/contexts/theme";
import { setNotificationHandler, setupChannel } from "@/services/reminders";
import {
  getExactAlarmStatus,
  startReminderDiagnostics,
} from "@/services/reminder-diagnostics";

setNotificationHandler();
setupChannel().catch(() => {
  // Gagal menyiapkan channel — tidak menghentikan aplikasi.
});
startReminderDiagnostics();
getExactAlarmStatus();

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
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}