import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { getFirebaseAuth, hasFirebaseConfig } from '@/src/firebase/config';
import {
  getGoogleIdTokenRequestConfig,
  hasGoogleOAuthConfigForPlatform,
} from '@/src/lib/googleAuth';

type GoogleAuthSuccess = {
  type: 'success';
  params?: { id_token?: string };
  authentication?: { idToken?: string; id_token?: string };
};

function readGoogleIdToken(response: GoogleAuthSuccess): string | undefined {
  return (
    response.params?.id_token ??
    response.authentication?.idToken ??
    response.authentication?.id_token
  );
}

/**
 * Google sign-in via Expo Auth Session → Firebase.
 * Only mount from `GoogleSignInBlock` after `hasGoogleOAuthConfigForPlatform()` is true.
 */
export function useGoogleSignIn() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    getGoogleIdTokenRequestConfig(),
  );

  useEffect(() => {
    if (!response) {
      return;
    }
    if (response.type === 'dismiss' || response.type === 'cancel' || response.type === 'error') {
      setBusy(false);
      if (response.type === 'error') {
        Alert.alert('Google sign-in', response.error?.message ?? 'Something went wrong.');
      }
      return;
    }
    if (response.type !== 'success') {
      return;
    }

    const idToken = readGoogleIdToken(response as GoogleAuthSuccess);
    if (!idToken) {
      setBusy(false);
      Alert.alert('Google sign-in', 'No ID token returned. Check OAuth client setup.');
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setBusy(false);
      Alert.alert('Not available', 'Sign-in services are not configured.');
      return;
    }

    void (async () => {
      try {
        await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        router.replace('/');
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Google sign-in failed';
        Alert.alert('Could not sign in', message);
      } finally {
        setBusy(false);
      }
    })();
  }, [response, router]);

  const signInWithGoogle = useCallback(async () => {
    if (!hasFirebaseConfig) {
      Alert.alert('Not available', 'Connect OtterRide cloud before signing in.');
      return;
    }
    if (!request) {
      Alert.alert('Google sign-in', 'Still loading Google sign-in. Try again in a moment.');
      return;
    }
    setBusy(true);
    try {
      await promptAsync();
    } catch (e: unknown) {
      setBusy(false);
      const message = e instanceof Error ? e.message : 'Could not open Google sign-in';
      Alert.alert('Google sign-in', message);
    }
  }, [promptAsync, request]);

  return {
    signInWithGoogle,
    busy,
    ready: Boolean(request),
  };
}
