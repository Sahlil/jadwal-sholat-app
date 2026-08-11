import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { Colors } from "@/constants/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
    </>
  );
}
