import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkeletonBox } from '@/components/ui/Skeleton';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useRideHistory } from '@/src/hooks/useRideHistory';
import { formatMoney } from '@/src/lib/currency';
import { getRideProduct } from '@/src/lib/rideEstimates';
import type { RideRequest, RideStatus } from '@/src/types/ride';
import { useAuthStore } from '@/src/stores/authStore';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

function formatWhen(ride: RideRequest): string {
  const v = ride.createdAt as { toDate?: () => Date; seconds?: number } | undefined;
  try {
    const d = v?.toDate?.() ?? (typeof v?.seconds === 'number' ? new Date(v.seconds * 1000) : null);
    if (!d || Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function formatRoute(ride: RideRequest): string {
  const from =
    ride.pickupLabel?.trim() ||
    `${ride.pickup.latitude.toFixed(3)}, ${ride.pickup.longitude.toFixed(3)}`;
  const to =
    ride.dropoffLabel?.trim() ||
    `${ride.dropoff.latitude.toFixed(3)}, ${ride.dropoff.longitude.toFixed(3)}`;
  return `${from} → ${to}`;
}

function statusStyle(status: RideStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case 'completed':
      return { bg: 'bg-emerald-100', text: 'text-emerald-900', label: 'Completed' };
    case 'payment_complete':
      return { bg: 'bg-teal-100', text: 'text-teal-900', label: 'Paid' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-900', label: 'Cancelled' };
    case 'ongoing':
      return { bg: 'bg-blue-100', text: 'text-blue-900', label: 'In progress' };
    case 'arriving':
    case 'accepted':
      return { bg: 'bg-amber-100', text: 'text-amber-950', label: 'Driver' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Requested' };
  }
}

function TripCard({
  ride,
  asRider,
  currency,
}: {
  ride: RideRequest;
  asRider: boolean;
  currency: string;
}) {
  const st = statusStyle(ride.status);
  const product = getRideProduct(ride.rideProductId ?? 'otter_x');
  const fare =
    typeof ride.fareEstimateUsd === 'number'
      ? formatMoney(ride.fareEstimateUsd, currency)
      : '—';

  return (
    <Link href={{ pathname: '/(app)/ride/[id]', params: { id: ride.id } }} asChild>
      <Pressable className="mb-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-md shadow-black/5 active:opacity-95">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {product.name}
            </Text>
            <Text className="mt-1 text-lg font-extrabold text-ink">{fare}</Text>
            <Text className="mt-1 text-xs text-gray-500">{formatWhen(ride)}</Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${st.bg}`}>
            <Text className={`text-xs font-bold ${st.text}`}>{st.label}</Text>
          </View>
        </View>
        <Text className="mt-3 text-sm text-gray-600" numberOfLines={1}>
          {asRider ? `With ${ride.driverName ?? '—'}` : `Rider ${ride.riderName}`}
        </Text>
        {asRider && typeof ride.riderRatingDriver === 'number' ? (
          <Text className="mt-2 text-xs font-semibold text-gray-700">
            Your rating: {ride.riderRatingDriver}/5
          </Text>
        ) : null}
        {!asRider && typeof ride.driverRatingRider === 'number' ? (
          <Text className="mt-2 text-xs font-semibold text-gray-700">
            Your rating of rider: {ride.driverRatingRider}/5
          </Text>
        ) : null}
        <View className="mt-3 flex-row items-center gap-2">
          <FontAwesome name="map-marker" size={14} color="#6b7280" />
          <Text className="flex-1 text-xs text-gray-500" numberOfLines={2}>
            {formatRoute(ride)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

export default function TripHistoryScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const currency = usePreferencesStore((s) => s.currency);
  const { items, loading, error } = useRideHistory(uid);

  const grouped = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta =
        (a.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
      const tb =
        (b.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
      return tb - ta;
    });
  }, [items]);

  if (!hasFirebaseConfig) {
    return (
      <SafeAreaView className="flex-1 bg-surface px-5 pt-4">
        <Text className="text-base text-gray-600">
          Connect this app to OtterRide cloud to see your trip history.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface">
      {loading ? (
        <View className="flex-1 px-5 pt-6">
          <SkeletonBox className="h-28 w-full" />
          <SkeletonBox className="mt-4 h-28 w-full" />
          <SkeletonBox className="mt-4 h-28 w-full" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-red-800">{error}</Text>
          <Text className="mt-3 text-center text-sm text-gray-600">
            Deploy Firestore indexes for `riderId` / `driverId` + `createdAt` if the console shows a link.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
          {grouped.length === 0 ? (
            <Text className="mt-10 text-center text-base text-gray-600">
              No trips yet.
            </Text>
          ) : (
            grouped.map((ride) => (
              <TripCard key={ride.id} ride={ride} asRider={ride.riderId === uid} currency={currency} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
