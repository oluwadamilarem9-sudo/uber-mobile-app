import 'react-native-gesture-handler';
import '../global.css';
import 'react-native-reanimated';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { loadAsync, useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProviders } from '@/src/providers/AppProviders';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

enableFreeze(true);

SplashScreen.preventAutoHideAsync();

const otterNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FFD000',
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#1A1A1A',
    border: 'rgba(26,26,26,0.10)',
  },
};

export default function RootLayout() {
  const faWarmStarted = useRef(false);
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    void SplashScreen.hideAsync();
    if (!faWarmStarted.current) {
      faWarmStarted.current = true;
      void loadAsync(FontAwesome.font).catch(() => {
        /* non-fatal: icons may use fallback until retry */
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AppProviders>
      <ThemeProvider value={otterNavTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(welcome)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="(app)" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </AppProviders>
  );
}
