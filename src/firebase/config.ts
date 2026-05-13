import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig: Partial<FirebaseOptions> = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (v) => typeof v === 'string' && v.length > 0,
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

function getOrCreateApp(): FirebaseApp {
  if (!hasFirebaseConfig) {
    throw new Error(
      'Firebase is not configured. Copy `.env.example` to `.env` and add your web app keys.',
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig as FirebaseOptions);
  }
  return app;
}

/** Shared Firebase app instance (Auth, Firestore, etc.). */
export function getFirebaseApp(): FirebaseApp {
  return getOrCreateApp();
}

/** Firebase Auth singleton. Returns `undefined` until env vars are set (Phase 1 learning flow). */
export function getFirebaseAuth(): Auth | undefined {
  if (!hasFirebaseConfig) {
    return undefined;
  }
  if (auth) {
    return auth;
  }
  const firebaseApp = getOrCreateApp();
  if (Platform.OS === 'web') {
    auth = getAuth(firebaseApp);
    return auth;
  }
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(firebaseApp);
  }
  return auth;
}
