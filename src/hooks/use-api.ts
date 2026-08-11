import { useCallback, useEffect, useState, type DependencyList } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook generik untuk memuat data dari API.
 * `fetcher` dibungkus useCallback agar efek hanya berjalan saat deps berubah.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetcher());
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
