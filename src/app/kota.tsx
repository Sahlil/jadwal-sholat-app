import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";

import { getAllKabKota, searchKabKota } from "@/api/sholat";
import { ErrorView } from "@/components/error-view";
import { CityListSkeleton } from "@/components/skeletons";
import { useTheme } from "@/contexts/theme";
import type { ThemeColors } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useLocationCity } from "@/hooks/use-location-city";
import { syncCityData } from "@/services/offline";
import { getCachedKabKota, saveCachedKabKota } from "@/storage/cache";
import { saveSelectedCity } from "@/storage/city";
import type { KabKota } from "@/types/sholat";

export default function KotaScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const location = useLocationCity();

  // Tunda pencarian agar tidak memanggil API setiap ketikan.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isSearching = debouncedQuery.trim().length > 0;

  const allFetcher = useCallback(async () => {
    try {
      const fresh = await getAllKabKota();
      await saveCachedKabKota(fresh);
      return fresh;
    } catch (err) {
      const cached = await getCachedKabKota();
      if (cached) return cached.data;
      throw err;
    }
  }, []);
  const all = useApi(allFetcher);

  const searchFetcher = useCallback(
    async () => {
      const keyword = debouncedQuery.trim();
      try {
        return await searchKabKota(keyword);
      } catch (err) {
        const source = all.data ?? (await getCachedKabKota())?.data;
        if (source) {
          const normalized = keyword.toLowerCase();
          return source.filter((city) => city.lokasi.toLowerCase().includes(normalized));
        }
        throw err;
      }
    },
    [all.data, debouncedQuery],
  );
  const search = useApi(searchFetcher);

  const data = isSearching ? search.data : all.data;
  const loading = isSearching ? search.loading : all.loading;
  const error = isSearching ? search.error : all.error;
  const refetch = isSearching ? search.refetch : all.refetch;

  const selectCity = (city: KabKota) => {
    saveSelectedCity(city);
    // Unduh jadwal tahunan kota terpilih ke database lokal di background.
    syncCityData(city).catch(() => {
      // Gagal (mis. offline) — data akan diunduh saat app berikutnya dibuka.
    });
    // Unwind ke beranda sekaligus mengirim kota terpilih via params.
    router.navigate({ pathname: "/", params: { id: city.id, lokasi: city.lokasi } });
  };

  const locationStatus = location.status;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Pilih Kota / Kabupaten" }} />

      <TextInput
        style={styles.searchInput}
        placeholder="Cari kota, mis. Jakarta..."
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <View style={styles.locationSection}>
        {locationStatus.state === "idle" && (
          <Pressable style={styles.locationButton} onPress={location.detect}>
            <Text style={styles.locationButtonText}>Gunakan Lokasi Saya</Text>
          </Pressable>
        )}

        {locationStatus.state === "detecting" && (
          <View style={styles.locationBusy}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.locationInfoText}>Mendeteksi lokasi Anda...</Text>
          </View>
        )}

        {locationStatus.state === "success" && (
          <View style={styles.locationResult}>
            <Text style={styles.locationCity} numberOfLines={1}>
              {locationStatus.city.lokasi}
            </Text>
            <Text style={styles.locationInfoText}>
              Terdeteksi dari posisi Anda (jarak ±{Math.round(locationStatus.city.distanceKm)} km)
            </Text>
            <View style={styles.locationActions}>
              <Pressable
                style={styles.locationUseButton}
                onPress={() => selectCity(locationStatus.city)}
              >
                <Text style={styles.locationUseButtonText}>Gunakan Kota Ini</Text>
              </Pressable>
              <Pressable style={styles.locationDismiss} onPress={location.reset}>
                <Text style={styles.locationDismissText}>Batal</Text>
              </Pressable>
            </View>
          </View>
        )}

        {locationStatus.state === "error" && (
          <View style={styles.locationResult}>
            <Text style={styles.locationError}>{locationStatus.message}</Text>
            <View style={styles.locationActions}>
              <Pressable style={styles.locationUseButton} onPress={location.detect}>
                <Text style={styles.locationUseButtonText}>Coba Lagi</Text>
              </Pressable>
              <Pressable style={styles.locationDismiss} onPress={location.reset}>
                <Text style={styles.locationDismissText}>Batal</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <CityListSkeleton />
      ) : error ? (
        <ErrorView message={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isSearching && data?.length ? (
              <Text style={styles.resultCount}>{data.length} hasil untuk &quot;{debouncedQuery}&quot;</Text>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Tidak ada kota yang cocok dengan pencarian Anda.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => selectCity(item)}>
              <Text style={styles.itemText} numberOfLines={1}>
                {item.lokasi}
              </Text>
              <Text style={styles.itemArrow}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    searchInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      marginHorizontal: 16,
      marginTop: 16,
    },
    locationSection: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
    },
    locationButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
    },
    locationButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    locationBusy: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 13,
    },
    locationResult: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      gap: 6,
    },
    locationCity: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    locationInfoText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    locationError: {
      color: colors.danger,
      fontSize: 13,
    },
    locationActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    locationUseButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
    },
    locationUseButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    locationDismiss: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    locationDismissText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 8,
    },
    resultCount: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 4,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    itemText: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
    },
    itemArrow: {
      color: colors.textSecondary,
      fontSize: 20,
      marginLeft: 8,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 32,
      fontSize: 14,
    },
  });