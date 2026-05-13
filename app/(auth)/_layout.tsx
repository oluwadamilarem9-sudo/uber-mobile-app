import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuthStore } from '@/src/stores/authStore';

/** Screens for logged-out users only. */
export default function AuthLayout() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();

  const inAuthRoutes = segments[0] === '(auth)';

  if (hydrated && user && inAuthRoutes) {
    // Only leave the auth stack when we are actually on login/signup.
    // Do NOT redirect when the user is already in `(app)` — that caused a redirect loop with `/`.
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#111827',
      }}>
      <Stack.Screen name="login" options={{ title: 'Sign in' }} />
      <Stack.Screen name="signup" options={{ title: 'Create account' }} />
    </Stack>
  );
}
