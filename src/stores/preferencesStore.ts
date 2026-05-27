import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type PreferencesState = {
  hydrated: boolean;
  currency: string;
  countryCode: string;
  setCurrency: (code: string) => void;
  setCountryCode: (code: string) => void;
  hydrate: () => Promise<void>;
};

const KEY = '@otterride_preferences_v1';

type Persisted = {
  currency?: string;
  countryCode?: string;
};

async function readPersisted(): Promise<Persisted | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

async function writePersisted(next: Persisted): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore (best-effort persistence)
  }
}

function snapshot(state: PreferencesState): Persisted {
  return {
    currency: state.currency,
    countryCode: state.countryCode,
  };
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  hydrated: false,
  currency: 'USD',
  countryCode: 'NG',
  setCurrency: (code) => {
    set({ currency: code });
    void writePersisted(snapshot(get()));
  },
  setCountryCode: (code) => {
    set({ countryCode: code });
    void writePersisted(snapshot(get()));
  },
  hydrate: async () => {
    const persisted = await readPersisted();
    if (persisted) {
      set({
        currency: persisted.currency ?? 'USD',
        countryCode: persisted.countryCode ?? 'NG',
        hydrated: true,
      });
      return;
    }
    set({ hydrated: true });
  },
}));
