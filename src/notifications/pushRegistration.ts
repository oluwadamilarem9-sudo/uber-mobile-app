import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { hasFirebaseConfig } from '@/src/firebase/config';
import { getFirestoreDb } from '@/src/firebase/firestore';

const ANDROID_CHANNEL_ID = 'ride-updates';

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Ride updates',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFD000',
  });
}

/**
 * Registers for push (Expo token; uses FCM on Android in release/EAS builds) and saves token to Firestore.
 * Returns the Expo push token string, or null if unavailable (simulator, permission denied, web).
 */
export async function registerAndSavePushToken(uid: string): Promise<string | null> {
  if (!hasFirebaseConfig || Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  await ensureAndroidNotificationChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  const tokenRes = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenRes.data;

  const db = getFirestoreDb();
  await setDoc(
    doc(db, 'users', uid),
    {
      expoPushToken: token,
      expoPushTokenUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return token;
}

export { ANDROID_CHANNEL_ID };
