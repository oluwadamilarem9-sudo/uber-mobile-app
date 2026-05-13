import type { User } from 'firebase/auth';
import { create } from 'zustand';

type AuthState = {
  user: User | null;
  /** `true` after the first `onAuthStateChanged` callback (or immediately if Firebase is not configured). */
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
