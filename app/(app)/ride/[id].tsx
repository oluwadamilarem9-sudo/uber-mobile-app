import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { RideTripMap } from '@/components/maps/RideTripMap';
import { FadeInView } from '@/components/ui/FadeInView';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useDriverLocationBroadcast } from '@/src/hooks/useDriverLocationBroadcast';
import { useRideRequestSubscription } from '@/src/hooks/useRideRequestSubscription';
import {
  advanceRideTripStatus,
  cancelRideRequest,
} from '@/src/lib/rideRequestMutations';
import { useAuthStore } from '@/src/stores/authStore';

export default function RideDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = typeof id === 'string' ? id : id?.[0];
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid ?? '';
  const { ride, loading, error } = useRideRequestSubscription(requestId);
  const [cancelling, setCancelling] = useState(false);
  const [tripBusy, setTripBusy] = useState(false);

  const isRider = ride?.riderId === uid;
  const isDriver = ride?.driverId === uid;
  const canCancel =
    isRider &&
    ride &&
    (ride.status === 'requested' || ride.status === 'accepted' || ride.status === 'arriving');

  const broadcastEnabled = Boolean(
    isDriver &&
      ride &&
      (ride.status === 'accepted' || ride.status === 'arriving' || ride.status === 'ongoing'),
  );

  useDriverLocationBroadcast({
    requestId,
    driverId: uid,
    enabled: broadcastEnabled,
  });

  const statusLabel = useMemo(() => {
    if (!ride) {
      return '—';
    }
    return ride.status.charAt(0).toUpperCase() + ride.status.slice(1);
  }, [ride]);

  const onCancel = useCallback(async () => {
    if (!requestId || !uid || !ride) {
      return;
    }
    setCancelling(true);
    try {
      await cancelRideRequest(requestId, uid);
      Alert.alert('Cancelled', 'Your ride request was cancelled.', [
        { text: 'OK', onPress: () => router.replace('/(app)/(tabs)') },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not cancel';
      Alert.alert('Error', message);
    } finally {
      setCancelling(false);
    }
  }, [requestId, ride, router, uid]);

  const onAdvance = useCallback(
    async (next: 'arriving' | 'ongoing' | 'completed') => {
      if (!requestId || !uid) {
        return;
      }
      setTripBusy(true);
      try {
        await advanceRideTripStatus(requestId, uid, next);
        if (next === 'completed') {
          Alert.alert('Trip complete', 'Nice work — you can head back to home.', [
            { text: 'OK', onPress: () => router.replace('/(app)/(tabs)') },
          ]);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Could not update trip';
        Alert.alert('Error', message);
      } finally {
        setTripBusy(false);
      }
    },
    [requestId, router, uid],
  );

  if (!hasFirebaseConfig) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-base text-gray-600">Add Firebase config in `.env`.</Text>
      </View>
    );
  }

  if (!requestId) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base text-gray-600">Missing ride id.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  if (error && !ride) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-base text-red-800">{error}</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base text-gray-600">Ride not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <FadeInView>
        <RideTripMap ride={ride} height={220} />

        <View className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 shadow-sm">
          <Text className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
            Status
          </Text>
          <Text className="mt-1 text-2xl font-bold text-gray-900">{statusLabel}</Text>
        </View>

        <Text className="mt-6 text-sm text-gray-600">
          Rider: <Text className="font-semibold text-gray-900">{ride.riderName}</Text>
        </Text>
        {ride.driverName ? (
          <Text className="mt-2 text-sm text-gray-600">
            Driver: <Text className="font-semibold text-gray-900">{ride.driverName}</Text>
          </Text>
        ) : null}

        <Text className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Pickup
        </Text>
        <Text className="mt-1 text-base text-gray-900">
          {ride.pickup.latitude.toFixed(5)}, {ride.pickup.longitude.toFixed(5)}
        </Text>
        <Text className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Drop-off
        </Text>
        <Text className="mt-1 text-base text-gray-900">
          {ride.dropoff.latitude.toFixed(5)}, {ride.dropoff.longitude.toFixed(5)}
        </Text>

        {isDriver && ride.status === 'accepted' ? (
          <Pressable
            disabled={tripBusy}
            onPress={() => void onAdvance('arriving')}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            className="mt-8 items-center justify-center rounded-2xl bg-gray-900 py-4 shadow-md shadow-gray-900/25 active:opacity-95 disabled:opacity-50">
            {tripBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Head to pickup</Text>
            )}
          </Pressable>
        ) : null}

        {isDriver && ride.status === 'arriving' ? (
          <Pressable
            disabled={tripBusy}
            onPress={() => void onAdvance('ongoing')}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            className="mt-8 items-center justify-center rounded-2xl bg-gray-900 py-4 shadow-md shadow-gray-900/25 active:opacity-95 disabled:opacity-50">
            {tripBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Start trip (picked up)</Text>
            )}
          </Pressable>
        ) : null}

        {isDriver && ride.status === 'ongoing' ? (
          <Pressable
            disabled={tripBusy}
            onPress={() => void onAdvance('completed')}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            className="mt-8 items-center justify-center rounded-2xl bg-gray-900 py-4 shadow-md shadow-gray-900/25 active:opacity-95 disabled:opacity-50">
            {tripBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Complete trip</Text>
            )}
          </Pressable>
        ) : null}

        {ride.status === 'completed' ? (
          <Pressable
            onPress={() => router.replace('/(app)/(tabs)')}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            className="mt-6 items-center justify-center rounded-2xl border border-gray-200 bg-white py-4 shadow-sm active:opacity-95">
            <Text className="text-base font-semibold text-gray-900">Back to home</Text>
          </Pressable>
        ) : null}

        {!isRider && !isDriver ? (
          <Text className="mt-6 text-sm text-gray-600">
            You are viewing this trip as neither the rider nor the assigned driver.
          </Text>
        ) : null}

        {isRider && ride.status !== 'completed' && ride.status !== 'cancelled' ? (
          <Text className="mt-4 text-xs leading-5 text-gray-500">
            Live map and driver position update while the driver is on the way.
          </Text>
        ) : null}

        {canCancel ? (
          <Pressable
            onPress={() => void onCancel()}
            disabled={cancelling}
            android_ripple={{ color: 'rgba(127,29,29,0.15)' }}
            className="mt-10 items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-4 active:opacity-85 disabled:opacity-50">
            {cancelling ? (
              <ActivityIndicator color="#991b1b" />
            ) : (
              <Text className="text-base font-semibold text-red-900">Cancel request</Text>
            )}
          </Pressable>
        ) : null}
      </FadeInView>
    </ScrollView>
  );
}
