import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = '@otterride_recent_destinations_v1';
const SAVED_KEY = '@otterride_saved_places_v1';

export type StoredPlace = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  savedAt: number;
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadRecentDestinations(): Promise<StoredPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as StoredPlace[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export async function pushRecentDestination(place: Omit<StoredPlace, 'id' | 'savedAt'>): Promise<void> {
  const next: StoredPlace = {
    id: uid(),
    ...place,
    savedAt: Date.now(),
  };
  const prev = await loadRecentDestinations();
  const filtered = prev.filter(
    (p) =>
      Math.abs(p.latitude - next.latitude) > 0.0001 ||
      Math.abs(p.longitude - next.longitude) > 0.0001,
  );
  const merged = [next, ...filtered].slice(0, 8);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(merged));
}

export async function loadSavedPlaces(): Promise<StoredPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as StoredPlace[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export async function addSavedPlace(place: Omit<StoredPlace, 'id' | 'savedAt'>): Promise<void> {
  const next: StoredPlace = { id: uid(), ...place, savedAt: Date.now() };
  const prev = await loadSavedPlaces();
  const merged = [next, ...prev.filter((p) => p.label !== next.label)].slice(0, 12);
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(merged));
}

export async function removeSavedPlace(id: string): Promise<void> {
  const prev = await loadSavedPlaces();
  await AsyncStorage.setItem(
    SAVED_KEY,
    JSON.stringify(prev.filter((p) => p.id !== id)),
  );
}
