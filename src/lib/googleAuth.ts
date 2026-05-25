import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

function readEnv(value: string | undefined): string {
  return (value ?? '').replace(/^["']|["']$/g, '').trim();
}

/** Google OAuth client IDs (Google Cloud Console → Credentials). */
export const googleOAuthConfig = {
  webClientId: readEnv(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  androidClientId: readEnv(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  iosClientId: readEnv(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
};

export function hasGoogleOAuthConfig(): boolean {
  return hasGoogleOAuthConfigForPlatform();
}

/** Expo Google auth throws on Android if `androidClientId` is missing at hook init. */
export function hasGoogleOAuthConfigForPlatform(): boolean {
  const { webClientId, androidClientId, iosClientId } = googleOAuthConfig;
  if (!webClientId) {
    return false;
  }
  if (Platform.OS === 'android') {
    return Boolean(androidClientId);
  }
  if (Platform.OS === 'ios') {
    return Boolean(iosClientId || webClientId);
  }
  return true;
}

/**
 * Must be listed under Google Cloud → Credentials → **Web** client → Authorized redirect URIs.
 * In Expo Go this is often `https://auth.expo.io/@YOUR_EXPO_USERNAME/uber-mobile-app`.
 */
export function getGoogleOAuthRedirectUri(): string {
  const override = readEnv(process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI);
  if (override) {
    return override;
  }
  return makeRedirectUri({
    scheme: 'otterride',
    path: 'oauth2redirect',
  });
}

export function getGoogleIdTokenRequestConfig() {
  const { webClientId, androidClientId, iosClientId } = googleOAuthConfig;
  return {
    webClientId,
    redirectUri: getGoogleOAuthRedirectUri(),
    ...(Platform.OS === 'android' ? { androidClientId } : {}),
    ...(Platform.OS === 'ios' && iosClientId ? { iosClientId } : {}),
  };
}

/** Log once in dev so you can paste the URI into Google Cloud Console. */
export function logGoogleRedirectUriForSetup(): void {
  if (!__DEV__) {
    return;
  }
  const uri = getGoogleOAuthRedirectUri();
  console.info(
    '[OtterRide] Google OAuth redirect URI — add this to Web client → Authorized redirect URIs:\n',
    uri,
  );
}
