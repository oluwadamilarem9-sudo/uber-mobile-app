import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  View,
} from 'react-native';

import { DriverRequestRow } from '@/components/driver/DriverRequestRow';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useDriverPresence } from '@/src/hooks/useDriverPresence';
import { useOpenRideRequests } from '@/src/hooks/useOpenRideRequests';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { createRideAcceptedNotification } from '@/src/lib/notificationMutations';
import { acceptRideRequest } from '@/src/lib/rideRequestMutations';
import type { RideRequest } from '@/src/types/ride';
import { useAuthStore } from '@/src/stores/authStore';

export default function DriverRequestsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid ?? '';
  const { data: profile } = useUserProfile(uid);
  const { active: isOnline, loading: presenceLoading } = useDriverPresence(uid);
  const { items, loading, error } = useOpenRideRequests();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const driverName =
    profile?.displayName?.trim() ||
    user?.email?.split('@')[0]?.trim() ||
    'Driver';

  const onAccept = useCallback(
    async (row: RideRequest) => {
      if (!hasFirebaseConfig || !uid) {
        Alert.alert('Firebase', 'Configure `.env` and sign in.');
        return;
      }
      if (!isOnline) {
        Alert.alert('Offline', 'Go online from Profile → Driver availability first.');
        return;
      }
      setAcceptingId(row.id);
      try {
        await acceptRideRequest(row.id, uid, driverName);
        try {
          await createRideAcceptedNotification({
            fromUserId: uid,
            toUserId: row.riderId,
            driverName,
            rideRequestId: row.id,
          });
        } catch {
          // Non-fatal: rider still sees realtime ride doc updates.
        }
        router.replace({ pathname: '/(app)/ride/[id]', params: { id: row.id } });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Could not accept';
        Alert.alert('Accept failed', message);
      } finally {
        setAcceptingId(null);
      }
    },
    [driverName, isOnline, router, uid],
  );

  const renderItem = useCallback(
    ({ item }: { item: RideRequest }) => (
      <DriverRequestRow
        item={item}
        acceptDisabled={Boolean(acceptingId) || presenceLoading || !isOnline}
        busyHere={acceptingId === item.id}
        onAccept={onAccept}
      />
    ),
    [acceptingId, isOnline, onAccept, presenceLoading],
  );

  const keyExtractor = useCallback((r: RideRequest) => r.id, []);

  if (!hasFirebaseConfig) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-base text-gray-600">Add Firebase config in `.env`.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111" />
        </View>
      ) : (
        <FlatList
          className="flex-1 px-4 pt-4"
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
          ListEmptyComponent={
            <Text className="mt-8 text-center text-base text-gray-600">
              No open requests right now.
            </Text>
          }
          ListHeaderComponent={
            <>
              {!presenceLoading && !isOnline ? (
                <View className="mb-3 rounded-xl bg-amber-100 px-3 py-3">
                  <Text className="text-sm font-medium text-amber-950">
                    You are offline. Open Profile, scroll to Driver availability, and switch Online to
                    accept requests.
                  </Text>
                </View>
              ) : null}
              {error ? (
                <Text className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</Text>
              ) : null}
            </>
          }
        />
      )}
    </View>
  );
}
