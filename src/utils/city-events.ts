type CityChangeListener = () => void;

const listeners = new Set<CityChangeListener>();

export function subscribeCityChange(listener: CityChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitCityChange(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Listener error tidak boleh memutus yang lain
    }
  }
}