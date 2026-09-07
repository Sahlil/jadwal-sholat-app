import { useCity } from '@/contexts/city-context';
import type { KabKota } from '@/types/sholat';

export const DEFAULT_CITY: KabKota = {
  id: '58a2fc6ed39fd083f55d4182bf88826d',
  lokasi: 'KOTA JAKARTA',
};

/**
 * Kota aktif dari CityContext (single source of truth).
 * Mengembalikan null selama masih dimuat dari storage.
 */
export function useSelectedCity(): KabKota | null {
  const { city, loading } = useCity();
  if (loading) return null;
  return city;
}

/** Helper untuk memicu refresh di layar lain. */
export { useCity };