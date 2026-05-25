import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { PushNotificationManager } from '@/src/notifications/PushNotificationManager';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { isUserProfileComplete } from '@/src/lib/isProfileComplete';
import { appFonts } from '@/src/theme/fonts';
import { useAuthStore } from '@/src/stores/authStore';

/**
 * Protected shell: session + profile completeness (onboarding) before heavy stack.
 * Keeps root `app/index.tsx` fast by not awaiting Firestore there.
 */
export default function AppGroupLayout() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid;
  const segments = useSegments();

  const { data: profile, isPending: profilePending } = useUserProfile(uid);

  const onOnboardingRoute = (segments as readonly string[]).includes('onboarding');

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#FFCC00" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (hasFirebaseConfig) {
    if (profilePending) {
      return (
        <View className="flex-1 items-center justify-center bg-surface">
          <ActivityIndicator size="large" color="#FFCC00" />
        </View>
      );
    }
    if (!isUserProfileComplete(profile) && !onOnboardingRoute) {
      return <Redirect href="/(app)/onboarding" />;
    }
  }

  return (
    <>
      <PushNotificationManager />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
            color: '#1A1A1A',
            fontFamily: appFonts.semibold,
          },
          headerTintColor: '#1A1A1A',
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="request-ride"
          options={{ headerShown: true, title: 'Request a ride' }}
        />
        <Stack.Screen
          name="driver-requests"
          options={{ headerShown: true, title: 'Open requests' }}
        />
        <Stack.Screen
          name="ride/[id]"
          options={{ headerShown: false, title: 'Trip', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="trip-history"
          options={{ headerShown: true, title: 'Trip history' }}
        />
        <Stack.Screen
          name="driver/[id]"
          options={{ headerShown: true, title: 'Driver', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'OtterRide',
            headerShown: true,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
