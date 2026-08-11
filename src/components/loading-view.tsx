import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

export function LoadingView({ message = "Memuat data..." }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});
