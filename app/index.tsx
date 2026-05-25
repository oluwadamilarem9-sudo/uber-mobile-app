import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/src/stores/authStore';
import { hasWelcomeCompleted } from '@/src/lib/welcomeStorage';

/**
 * Entry routing: welcome gate for guests only. Signed-in users go straight to the app shell;
 * profile/onboarding gating lives in `app/(app)/_layout.tsx` to avoid blocking startup on Firestore.
 */
export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  const [guestIntroReady, setGuestIntroReady] = useState(false);
  const [guestNeedsWelcome, setGuestNeedsWelcome] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (user) {
      setGuestIntroReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const done = await hasWelcomeCompleted();
      if (!cancelled) {
        setGuestNeedsWelcome(!done);
        setGuestIntroReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, user]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#FFCC00" />
      </View>
    );
  }

  if (!user) {
    if (!guestIntroReady) {
      return (
        <View className="flex-1 items-center justify-center bg-surface">
          <ActivityIndicator size="large" color="#FFCC00" />
        </View>
      );
    }
    if (guestNeedsWelcome) {
      return <Redirect href="/(welcome)/splash" />;
    }
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
