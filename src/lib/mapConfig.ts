import { Platform } from 'react-native';
import { PROVIDER_GOOGLE } from 'react-native-maps';

/** Injected at build time via app.config.js → AndroidManifest / Info.plist */
export const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/** Use Google provider only when a key exists (avoids native crash on misconfigured builds). */
export const MAP_PROVIDER =
  GOOGLE_MAPS_KEY && Platform.OS !== 'web' ? PROVIDER_GOOGLE : undefined;

export const MAP_FEATURES = {
  traffic: Boolean(GOOGLE_MAPS_KEY),
};
