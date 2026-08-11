import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";

import { getAllKabKota, searchKabKota } from "@/api/sholat";
import { ErrorView } from "@/components/error-view";
import { LoadingView } from "@/components/loading-view";
import { Colors } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { saveSelectedCity } from "@/storage/city";
import type { KabKota } from "@/types/sholat";

export default function KotaScreen() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Tunda pencarian agar tidak memanggil API setiap ketikan.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isSearching = debouncedQuery.trim().length > 0;

  const allFetcher = useCallback(() => getAllKabKota(), []);
  const all = useApi(allFetcher, []);

  const searchFetcher = useCallback(
    () => searchKabKota(debouncedQuery.trim()),
    [debouncedQuery],
  );
  const search = useApi(searchFetcher, [debouncedQuery]);

  const data = isSearching ? search.data : all.data;
  const loading = isSearching ? search.loading : all.loading;
  const error = isSearching ? search.error : all.error;
  const refetch = isSearching ? search.refetch : all.refetch;

  const selectCity = (city: KabKota) => {
    saveSelectedCity(city);
    // Unwind ke beranda sekaligus mengirim kota terpilih via params.
    router.navigate({ pathname: "/", params: { id: city.id, lokasi: city.lokasi } });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Pilih Kota / Kabupaten" }} />

      <TextInput
        style={styles.searchInput}
        placeholder="Cari kota, mis. Jakarta..."
        placeholderTextColor={Colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      {loading ? (
        <LoadingView message="Memuat daftar kota..." />
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
              <Text style={styles.resultCount}>{data.length} hasil untuk "{debouncedQuery}"</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    margin: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  resultCount: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemText: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  itemArrow: {
    color: Colors.textSecondary,
    fontSize: 20,
    marginLeft: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
  },
});
