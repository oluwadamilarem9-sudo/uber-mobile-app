import * as Notifications from 'expo-notifications';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';

import { hasFirebaseConfig } from '@/src/firebase/config';
import { getFirestoreDb } from '@/src/firebase/firestore';
import { ensureNotificationHandlerConfigured } from '@/src/notifications/notificationBehavior';
import { ANDROID_CHANNEL_ID, registerAndSavePushToken } from '@/src/notifications/pushRegistration';
import { useAuthStore } from '@/src/stores/authStore';

function readRideRequestId(data: Record<string, unknown>): string | undefined {
  const v = data.rideRequestId;
  return typeof v === 'string' ? v : undefined;
}

/**
 * Registers Expo push (FCM-backed on Android in production), listens for Firestore `notifications`
 * rows for the signed-in user, and surfaces them as local alerts. Tap opens the ride screen.
 */
export function PushNotificationManager() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.uid);
  const coldStartHandled = useRef(false);

  useEffect(() => {
    ensureNotificationHandlerConfigured();
  }, []);

  useEffect(() => {
    if (!uid || !hasFirebaseConfig || Platform.OS === 'web') {
      return;
    }
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!cancelled) {
        void registerAndSavePushToken(uid);
      }
    });
    return () => {
      cancelled = true;
      task.cancel?.();
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || !hasFirebaseConfig || Platform.OS === 'web') {
      return;
    }

    let isFirstSnapshot = true;
    const seenIds = new Set<string>();
    let unsub: (() => void) | undefined;
    let cancelled = false;

    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) {
        return;
      }
      const db = getFirestoreDb();
      const q = query(
        collection(db, 'notifications'),
        where('toUserId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(25),
      );

      unsub = onSnapshot(q, (snap) => {
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          snap.docs.forEach((d) => seenIds.add(d.id));
          return;
        }

        snap.docChanges().forEach((change) => {
          if (change.type !== 'added') {
            return;
          }
          const docId = change.doc.id;
          if (seenIds.has(docId)) {
            return;
          }
          seenIds.add(docId);
          const data = change.doc.data() as Record<string, unknown>;
          if (data.read === true) {
            return;
          }
          const title = typeof data.title === 'string' ? data.title : 'Update';
          const body = typeof data.body === 'string' ? data.body : '';
          const rideRequestId = readRideRequestId(data);
          void Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: rideRequestId ? { rideRequestId } : {},
              sound: 'default',
              ...(Platform.OS === 'android' ? { android: { channelId: ANDROID_CHANNEL_ID } } : {}),
            },
            trigger: null,
          });
        });
      });
    });

    return () => {
      cancelled = true;
      task.cancel?.();
      unsub?.();
    };
  }, [uid]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const raw = response.notification.request.content.data;
      const rideRequestId =
        raw &&
        typeof raw === 'object' &&
        'rideRequestId' in raw &&
        typeof (raw as { rideRequestId?: unknown }).rideRequestId === 'string'
          ? (raw as { rideRequestId: string }).rideRequestId
          : undefined;
      if (rideRequestId) {
        router.push({ pathname: '/(app)/ride/[id]', params: { id: rideRequestId } });
      }
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (Platform.OS === 'web' || coldStartHandled.current) {
      return;
    }
    coldStartHandled.current = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        const raw = response?.notification.request.content.data;
        const rideRequestId =
          raw &&
          typeof raw === 'object' &&
          'rideRequestId' in raw &&
          typeof (raw as { rideRequestId?: unknown }).rideRequestId === 'string'
            ? (raw as { rideRequestId: string }).rideRequestId
            : undefined;
        if (rideRequestId) {
          router.replace({ pathname: '/(app)/ride/[id]', params: { id: rideRequestId } });
        }
      });
    });
    return () => {
      task.cancel?.();
    };
  }, [router]);

  return null;
}
