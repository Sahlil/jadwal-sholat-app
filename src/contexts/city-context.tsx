import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';

import { getSelectedCity, saveSelectedCity } from '@/storage/city';
import type { KabKota } from '@/types/sholat';

interface CityContextType {
  city: KabKota | null;
  loading: boolean;
  setCity: (city: KabKota) => void;
  refresh: () => void;
}

const DEFAULT_CITY: KabKota = {
  id: '58a2fc6ed39fd083f55d4182bf88826d',
  lokasi: 'KOTA JAKARTA',
};

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<KabKota | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  const loadFromStorage = async () => {
    if (!mountedRef.current) return;
    try {
      const saved = await getSelectedCity();
      if (mountedRef.current) {
        setCityState(saved ?? DEFAULT_CITY);
      }
    } catch {
      if (mountedRef.current) {
        setCityState(DEFAULT_CITY);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const setCity = async (newCity: KabKota) => {
    await saveSelectedCity(newCity);
    if (mountedRef.current) {
      setCityState(newCity);
    }
  };

  const refresh = async () => {
    if (mountedRef.current) {
      setLoading(true);
    }
    await loadFromStorage();
  };

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    setTimeout(() => loadFromStorage(), 0);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Refresh on focus (only if mounted)
  useFocusEffect(
    useCallback(() => {
      if (mountedRef.current) {
        loadFromStorage();
      }
    }, []),
  );

  return (
    <CityContext.Provider value={{ city, loading, setCity, refresh }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): CityContextType {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}