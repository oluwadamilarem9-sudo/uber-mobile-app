import { Redirect, Stack, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useAuthStore } from '@/src/stores/authStore';

WebBrowser.maybeCompleteAuthSession();
import { appFonts } from '@/src/theme/fonts';

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
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
          color: '#1A1A1A',
          fontFamily: appFonts.semibold,
        },
        headerTintColor: '#1A1A1A',
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="login" options={{ title: 'Sign in' }} />
      <Stack.Screen name="signup" options={{ title: 'Create account' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Reset password' }} />
    </Stack>
  );
}
