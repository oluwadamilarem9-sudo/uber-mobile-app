import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { PushNotificationManager } from '@/src/notifications/PushNotificationManager';
import { useAuthStore } from '@/src/stores/authStore';

/**
 * Protected shell only: session check + stack. Profile vs onboarding is handled in `app/index.tsx`
 * so we never stack multiple `<Redirect>` decisions in parent and child layouts.
 */
export default function AppGroupLayout() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F5C400" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <PushNotificationManager />
      <Stack screenOptions={{ headerShown: false }}>
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
          options={{ headerShown: true, title: 'Ride' }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Info', headerShown: true }}
        />
      </Stack>
    </>
  );
}
