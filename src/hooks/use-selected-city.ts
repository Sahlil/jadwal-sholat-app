import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { getSelectedCity, saveSelectedCity } from '@/storage/city';
import type { KabKota } from '@/types/sholat';

export const DEFAULT_CITY: KabKota = {
  id: '58a2fc6ed39fd083f55d4182bf88826d',
  lokasi: 'KOTA JAKARTA',
};

/**
 * Kota aktif: prioritas dari URL params (hasil pemilihan di layar kota),
 * jika tidak ada, dibaca dari penyimpanan lokal (dipakai juga oleh widget).
 * Mengembalikan null selama masih dimuat dari storage.
 */
export function useSelectedCity(): KabKota | null {
  const params = useLocalSearchParams<{ id?: string; lokasi?: string }>();
  const paramCity = params.id && params.lokasi ? { id: params.id, lokasi: params.lokasi } : null;

  const [savedCity, setSavedCity] = useState<KabKota | null>(null);

  useEffect(() => {
    if (params.id && params.lokasi) {
      saveSelectedCity({ id: params.id, lokasi: params.lokasi });
      return;
    }

    getSelectedCity().then((saved) => setSavedCity(saved ?? DEFAULT_CITY));
  }, [params.id, params.lokasi]);

  return paramCity ?? savedCity;
}
