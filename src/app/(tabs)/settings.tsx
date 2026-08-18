import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";

import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  {
    icon: "compass",
    title: "Arah Kiblat",
    subtitle: "Temukan arah kiblat dengan sensor kompas",
    onPress: () => router.push("/kiblat"),
  },
  {
    icon: "notifications",
    title: "Pengingat Sholat",
    subtitle: "Atur notifikasi waktu sholat",
    onPress: () => router.push("/pengingat"),
  },
];

export default function SettingsScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {MENU_ITEMS.map((item) => (
        <Pressable key={item.title} style={styles.card} onPress={item.onPress}>
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
      ))}

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={mode === "dark" ? "moon" : "sunny"}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Tema Gelap</Text>
          <Text style={styles.subtitle}>Aktifkan tampilan gelap</Text>
        </View>
        <Switch
          value={mode === "dark"}
          onValueChange={toggleTheme}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
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
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    textWrap: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
  });