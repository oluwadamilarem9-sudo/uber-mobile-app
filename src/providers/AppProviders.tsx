import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, type ReactNode } from 'react';

import { getFirebaseAuth, hasFirebaseConfig } from '@/src/firebase/config';
import { useAuthStore } from '@/src/stores/authStore';

function AuthListener({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!hasFirebaseConfig) {
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setHydrated(true);
      return;
    }

    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth) {
      useAuthStore.getState().setHydrated(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      useAuthStore.getState().setUser(nextUser);
      useAuthStore.getState().setHydrated(true);
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useRef(
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          /** Fewer network round-trips on revisit; explicit invalidations still win. */
          staleTime: 30_000,
          gcTime: 30 * 60 * 1000,
        },
      },
    }),
  ).current;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener>{children}</AuthListener>
    </QueryClientProvider>
  );
}
