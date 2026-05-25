import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DriverInfoCard } from '@/components/ride/DriverInfoCard';
import { EtaChip } from '@/components/ride/EtaChip';
import { RideSearchingBanner } from '@/components/ride/RideSearchingBanner';
import { RideStatusTimeline } from '@/components/ride/RideStatusTimeline';
import { SearchingPulseRing } from '@/components/ride/SearchingPulseRing';
import { TripRatingSection } from '@/components/ride/TripRatingSection';
import { RideTripMap } from '@/components/maps/RideTripMap';
import { RideScreenSkeleton } from '@/components/ui/Skeleton';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useDriverLocationBroadcast } from '@/src/hooks/useDriverLocationBroadcast';
import { useRideRequestSubscription } from '@/src/hooks/useRideRequestSubscription';
import { haversineKm } from '@/src/lib/geo';
import type { LatLng } from '@/src/lib/directions';
import { DEMO_PAYMENT_COPY } from '@/src/lib/demoPayment';
import { getMockDriverProfile } from '@/src/lib/mockDriverProfile';
import { getRideProduct } from '@/src/lib/rideEstimates';
import {
  advanceRideTripStatus,
  cancelRideRequest,
  markRidePaymentComplete,
  submitDriverRatesRider,
  submitRiderRatesDriver,
} from '@/src/lib/rideRequestMutations';
import { enqueueRideNotification } from '@/src/lib/notificationMutations';
import { hapticSuccess } from '@/src/lib/haptics';
import { useAuthStore } from '@/src/stores/authStore';

const WIN_H = Dimensions.get('window').height;

const SHEET_SPRING = { damping: 24, stiffness: 280, mass: 0.85 };

function nearestSnapWorklet(h: number, snaps: readonly number[]) {
  'worklet';
  let best = snaps[0];
  let bestD = Math.abs(h - best);
  for (let i = 1; i < snaps.length; i++) {
    const d = Math.abs(h - snaps[i]);
    if (d < bestD) {
      bestD = d;
      best = snaps[i];
    }
  }
  return best;
}

function useGhostFleet(
  center: { latitude: number; longitude: number } | null,
  active: boolean,
): LatLng[] {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active || !center) {
      return;
    }
    const id = setInterval(() => setTick((t) => t + 1), 850);
    return () => clearInterval(id);
  }, [active, center?.latitude, center?.longitude]);

  return useMemo(() => {
    if (!center || !active) {
      return [];
    }
    const out: LatLng[] = [];
    const n = 7;
    for (let i = 0; i < n; i += 1) {
      const ang = (i / n) * Math.PI * 2 + tick * 0.22;
      const r = 0.0026 + (i % 3) * 0.00055;
      out.push({
        latitude: center.latitude + Math.sin(ang) * r,
        longitude: center.longitude + Math.cos(ang) * r * 1.15,
      });
    }
    return out;
  }, [center, active, tick]);
}

function useEtaSeconds(
  fromLat: number | undefined,
  fromLng: number | undefined,
  toLat: number | undefined,
  toLng: number | undefined,
  enabled: boolean,
): number | null {
  const [sec, setSec] = useState<number | null>(null);

  useEffect(() => {
    if (
      !enabled ||
      fromLat === undefined ||
      fromLng === undefined ||
      toLat === undefined ||
      toLng === undefined
    ) {
      setSec(null);
      return;
    }
    const from = { latitude: fromLat, longitude: fromLng };
    const to = { latitude: toLat, longitude: toLng };
    const km = haversineKm(from, to);
    const initial = Math.max(40, Math.round((km / 28) * 3600));
    setSec(initial);
    const id = setInterval(() => {
      setSec((s) => (s === null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [fromLat, fromLng, toLat, toLng, enabled]);

  return sec;
}

function tripDriverNotifyPayload(
  next: 'arriving' | 'ongoing' | 'completed',
): { title: string; body: string; type: string } | null {
  switch (next) {
    case 'arriving':
      return {
        title: 'Driver is on the way',
        body: 'Your driver is heading to the pickup point.',
        type: 'trip_arriving',
      };
    case 'ongoing':
      return {
        title: 'Trip started',
        body: 'You are on the way to your destination.',
        type: 'trip_started',
      };
    case 'completed':
      return {
        title: 'Trip completed',
        body: 'Your driver ended the trip. Confirm payment when you are ready.',
        type: 'trip_completed',
      };
    default:
      return null;
  }
}

function useSearchBanner(
  rideStatus: string | undefined,
  isRider: boolean,
  requestId: string | undefined,
) {
  const searchStartRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'none' | 'search' | 'matched'>('none');

  useEffect(() => {
    searchStartRef.current = null;
  }, [requestId]);

  useEffect(() => {
    if (!isRider || !rideStatus) {
      setMode('none');
      return;
    }
    if (rideStatus === 'requested') {
      if (searchStartRef.current === null) {
        searchStartRef.current = Date.now();
      }
      setMode('search');
      return;
    }
    if (rideStatus === 'accepted') {
      const started = searchStartRef.current ?? Date.now();
      const wait = Math.max(0, 2600 - (Date.now() - started));
      const h = setTimeout(() => {
        setMode('matched');
      }, wait);
      const h2 = setTimeout(() => {
        setMode('none');
      }, wait + 1700);
      return () => {
        clearTimeout(h);
        clearTimeout(h2);
      };
    }
    setMode('none');
  }, [rideStatus, isRider]);

  return mode;
}

export default function RideDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = typeof id === 'string' ? id : id?.[0];
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid ?? '';
  const { ride, loading, error, syncing } = useRideRequestSubscription(requestId);
  const [cancelling, setCancelling] = useState(false);
  const [tripBusy, setTripBusy] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [riderRatingBusy, setRiderRatingBusy] = useState(false);
  const [driverRatingBusy, setDriverRatingBusy] = useState(false);

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

  const snapHeights = useMemo(
    () => [WIN_H * 0.24, WIN_H * 0.4, WIN_H * 0.58].map((x) => Math.round(x)),
    [],
  );
  const bottomInset = insets.bottom;
  const sheetH = useSharedValue(snapHeights[1]);
  const dragStartH = useSharedValue(snapHeights[1]);

  const sheetPan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onBegin(() => {
          dragStartH.value = sheetH.value;
        })
        .onUpdate((e) => {
          const next = dragStartH.value - e.translationY;
          const min = snapHeights[0];
          const max = snapHeights[2];
          sheetH.value = next < min ? min : next > max ? max : next;
        })
        .onEnd(() => {
          const target = nearestSnapWorklet(sheetH.value, snapHeights);
          sheetH.value = withSpring(target, SHEET_SPRING);
        }),
    [dragStartH, sheetH, snapHeights],
  );

  const sheetAnimStyle = useAnimatedStyle(() => ({
    height: sheetH.value + bottomInset,
  }));

  const bannerMode = useSearchBanner(ride?.status, isRider, requestId);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!isRider || ride?.status !== 'requested') {
      return;
    }
    const id = setInterval(() => setPulse((p) => (p + 0.04) % 1), 45);
    return () => clearInterval(id);
  }, [isRider, ride?.status]);

  const ghostCars = useGhostFleet(
    ride?.pickup ?? null,
    Boolean(isRider && ride?.status === 'requested'),
  );

  const driverPoint = ride?.driverLocation
    ? { latitude: ride.driverLocation.latitude, longitude: ride.driverLocation.longitude }
    : null;

  const etaPickup = useEtaSeconds(
    driverPoint?.latitude,
    driverPoint?.longitude,
    ride?.pickup.latitude,
    ride?.pickup.longitude,
    Boolean(ride && isRider && (ride.status === 'accepted' || ride.status === 'arriving') && driverPoint),
  );

  const etaDropoff = useEtaSeconds(
    driverPoint?.latitude,
    driverPoint?.longitude,
    ride?.dropoff.latitude,
    ride?.dropoff.longitude,
    Boolean(ride && isRider && ride.status === 'ongoing' && driverPoint),
  );

  const mockDriver = useMemo(() => {
    if (!ride?.driverId) {
      return null;
    }
    return getMockDriverProfile(ride.driverId, ride.driverName, ride.rideProductId ?? undefined);
  }, [ride?.driverId, ride?.driverName, ride?.rideProductId]);

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
      if (!requestId || !uid || !ride) {
        return;
      }
      setTripBusy(true);
      try {
        await advanceRideTripStatus(requestId, uid, next);
        const payload = tripDriverNotifyPayload(next);
        if (payload && ride.riderId) {
          try {
            await enqueueRideNotification({
              fromUserId: uid,
              toUserId: ride.riderId,
              rideRequestId: requestId,
              title: payload.title,
              body: payload.body,
              type: payload.type,
            });
          } catch {
            /* non-fatal */
          }
        }
        if (next === 'completed') {
          Alert.alert('Trip complete', 'The rider will confirm payment to close out the trip.');
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Could not update trip';
        Alert.alert('Error', message);
      } finally {
        setTripBusy(false);
      }
    },
    [requestId, ride, uid],
  );

  const onSubmitRiderRating = useCallback(
    async (stars: number, comment: string) => {
      if (!requestId || !uid) {
        return;
      }
      setRiderRatingBusy(true);
      try {
        await submitRiderRatesDriver(requestId, uid, stars, comment);
        hapticSuccess();
        Alert.alert('Thanks', 'Your rating was saved.');
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Could not save rating');
      } finally {
        setRiderRatingBusy(false);
      }
    },
    [requestId, uid],
  );

  const onSubmitDriverRating = useCallback(
    async (stars: number, comment: string) => {
      if (!requestId || !uid) {
        return;
      }
      setDriverRatingBusy(true);
      try {
        await submitDriverRatesRider(requestId, uid, stars, comment);
        hapticSuccess();
        Alert.alert('Thanks', 'Your rating was saved.');
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Could not save rating');
      } finally {
        setDriverRatingBusy(false);
      }
    },
    [requestId, uid],
  );

  const onConfirmPayment = useCallback(async () => {
    if (!requestId || !uid || !ride) {
      return;
    }
    setPaymentBusy(true);
    try {
      await markRidePaymentComplete(requestId, uid);
      hapticSuccess();
      if (ride.driverId) {
        try {
          await enqueueRideNotification({
            fromUserId: uid,
            toUserId: ride.driverId,
            rideRequestId: requestId,
            title: 'Payment confirmed',
            body: `${ride.riderName} confirmed payment for this trip.`,
            type: 'payment_complete',
          });
        } catch {
          /* non-fatal */
        }
      }
      Alert.alert('Thank you', 'This trip is fully closed out.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not confirm payment';
      Alert.alert('Error', message);
    } finally {
      setPaymentBusy(false);
    }
  }, [requestId, ride, uid]);

  if (!hasFirebaseConfig) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-center text-base text-gray-600">
          Trips are unavailable because this build is not connected to OtterRide cloud.
        </Text>
      </View>
    );
  }

  if (!requestId) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-base text-gray-600">Missing ride id.</Text>
      </View>
    );
  }

  if (loading) {
    return <RideScreenSkeleton />;
  }

  if (error && !ride) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-center text-base text-red-800">{error}</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-base text-gray-600">Ride not found.</Text>
      </View>
    );
  }

  const product = getRideProduct(ride.rideProductId ?? 'otter_x');
  const fareLabel =
    typeof ride.fareEstimateUsd === 'number' ? `$${ride.fareEstimateUsd.toFixed(0)} est.` : 'Fare TBD';

  return (
    <View className="flex-1 bg-black">
      <RideTripMap ride={ride} fullScreen ghostCars={ghostCars} />

      <Pressable
        onPress={() => router.back()}
        className="absolute left-4 rounded-full bg-white/95 p-3 shadow-lg"
        style={{ top: insets.top + 8 }}
        hitSlop={8}>
        <FontAwesome name="chevron-left" size={18} color="#111" />
      </Pressable>

      {isRider && ride.status === 'requested' ? (
        <SearchingPulseRing pulse={pulse} />
      ) : null}

      <RideSearchingBanner
        visible={bannerMode === 'search' || bannerMode === 'matched'}
        mode={bannerMode === 'matched' ? 'matched' : 'searching'}
      />

      <Animated.View
        className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-3xl border-t border-gray-100 bg-white shadow-2xl"
        style={[sheetAnimStyle, { paddingBottom: bottomInset }]}>
        <GestureDetector gesture={sheetPan}>
          <View className="items-center pb-1 pt-2">
            <View className="h-1.5 w-14 rounded-full bg-gray-200" />
            <Text className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Drag to resize
            </Text>
          </View>
        </GestureDetector>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="flex-row items-start justify-between pt-2">
            <View className="flex-1 pr-3">
              {syncing ? (
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                  Syncing…
                </Text>
              ) : null}
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {product.name}
              </Text>
              <Text className="mt-1 text-2xl font-bold text-ink">{fareLabel}</Text>
              {typeof ride.etaMinutesGuess === 'number' ? (
                <Text className="mt-1 text-sm text-gray-500">~{ride.etaMinutesGuess} min trip (est.)</Text>
              ) : null}
            </View>
            {(etaPickup !== null && (ride.status === 'accepted' || ride.status === 'arriving')) ||
            (etaDropoff !== null && ride.status === 'ongoing') ? (
              <EtaChip
                seconds={ride.status === 'ongoing' ? etaDropoff : etaPickup}
                label={ride.status === 'ongoing' ? 'ETA to stop' : 'ETA to pickup'}
              />
            ) : null}
          </View>

          <View className="mt-5">
            <RideStatusTimeline status={ride.status} />
          </View>

          {ride.driverId && mockDriver && ride.driverName ? (
            <View className="mt-6">
              <DriverInfoCard driverName={ride.driverName} profile={mockDriver} />
            </View>
          ) : null}

          <View className="mt-6 rounded-3xl border border-gray-100 bg-surface px-4 py-3">
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">Pickup</Text>
            <Text className="mt-1 text-sm font-semibold text-ink">
              {ride.pickup.latitude.toFixed(5)}, {ride.pickup.longitude.toFixed(5)}
            </Text>
            <Text className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-400">Drop-off</Text>
            <Text className="mt-1 text-sm font-semibold text-ink">
              {ride.dropoff.latitude.toFixed(5)}, {ride.dropoff.longitude.toFixed(5)}
            </Text>
          </View>

          {isDriver && ride.status === 'accepted' ? (
            <Pressable
              disabled={tripBusy}
              onPress={() => void onAdvance('arriving')}
              android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
              className="mt-6 items-center justify-center rounded-3xl bg-primary py-4 shadow-md shadow-amber-900/20 active:opacity-95 disabled:opacity-50">
              {tripBusy ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text className="text-base font-bold text-ink">Head to pickup</Text>
              )}
            </Pressable>
          ) : null}

          {isDriver && ride.status === 'arriving' ? (
            <Pressable
              disabled={tripBusy}
              onPress={() => void onAdvance('ongoing')}
              android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
              className="mt-6 items-center justify-center rounded-3xl bg-primary py-4 shadow-md shadow-amber-900/20 active:opacity-95 disabled:opacity-50">
              {tripBusy ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text className="text-base font-bold text-ink">Start trip (picked up)</Text>
              )}
            </Pressable>
          ) : null}

          {isDriver && ride.status === 'ongoing' ? (
            <Pressable
              disabled={tripBusy}
              onPress={() => void onAdvance('completed')}
              android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
              className="mt-6 items-center justify-center rounded-3xl bg-primary py-4 shadow-md shadow-amber-900/20 active:opacity-95 disabled:opacity-50">
              {tripBusy ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text className="text-base font-bold text-ink">Complete trip</Text>
              )}
            </Pressable>
          ) : null}

          {ride.status === 'completed' && isDriver ? (
            <View className="mt-6 gap-3">
              <Text className="text-center text-sm text-gray-600">
                Waiting for the rider to confirm payment. You will get a notification when they do.
              </Text>
              <Pressable
                onPress={() => router.replace('/(app)/(tabs)')}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                className="items-center justify-center rounded-3xl border border-gray-200 bg-white py-4 shadow-md shadow-black/5 active:opacity-95">
                <Text className="text-base font-bold text-ink">Back to home</Text>
              </Pressable>
            </View>
          ) : null}

          {ride.status === 'completed' && isRider ? (
            <View className="mt-6">
              <Text className="text-center text-xs leading-5 text-gray-600">{DEMO_PAYMENT_COPY}</Text>
              <Pressable
                disabled={paymentBusy}
                onPress={() => void onConfirmPayment()}
                android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                className="mt-4 items-center justify-center rounded-3xl bg-primary py-4 shadow-md shadow-amber-900/20 active:opacity-95 disabled:opacity-50">
                {paymentBusy ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text className="text-base font-bold text-ink">Confirm payment (demo)</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {ride.status === 'payment_complete' ? (
            <View className="mt-6 gap-2">
              {ride.paymentSimulated ? (
                <View className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <Text className="text-center text-xs font-semibold text-amber-950">
                    Demo settlement — no payment processor connected.
                  </Text>
                </View>
              ) : null}

              {isRider && typeof ride.riderRatingDriver !== 'number' ? (
                <TripRatingSection
                  title="Rate your driver"
                  subtitle="One rating per trip. Optional short comment."
                  busy={riderRatingBusy}
                  onSubmit={(stars, comment) => void onSubmitRiderRating(stars, comment)}
                />
              ) : null}

              {isRider && typeof ride.riderRatingDriver === 'number' ? (
                <View className="rounded-2xl border border-gray-100 bg-surface px-4 py-3">
                  <Text className="text-center text-sm font-semibold text-ink">
                    You rated this trip {ride.riderRatingDriver}★ — thanks!
                  </Text>
                </View>
              ) : null}

              {isDriver && typeof ride.driverRatingRider !== 'number' ? (
                <TripRatingSection
                  title="Rate your rider"
                  subtitle={`How was your trip with ${ride.riderName}?`}
                  busy={driverRatingBusy}
                  onSubmit={(stars, comment) => void onSubmitDriverRating(stars, comment)}
                />
              ) : null}

              {isDriver && typeof ride.driverRatingRider === 'number' ? (
                <View className="rounded-2xl border border-gray-100 bg-surface px-4 py-3">
                  <Text className="text-center text-sm font-semibold text-ink">
                    You rated this rider {ride.driverRatingRider}★ — thanks!
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={() => router.replace('/(app)/(tabs)')}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                className="items-center justify-center rounded-3xl border border-gray-200 bg-white py-4 shadow-md shadow-black/5 active:opacity-95">
                <Text className="text-base font-bold text-ink">Back to home</Text>
              </Pressable>
            </View>
          ) : null}

          {!isRider && !isDriver ? (
            <Text className="mt-6 text-sm text-gray-600">
              You are viewing this trip as neither the rider nor the assigned driver.
            </Text>
          ) : null}

          {isRider &&
          ride.status !== 'completed' &&
          ride.status !== 'payment_complete' &&
          ride.status !== 'cancelled' ? (
            <Text className="mt-4 text-xs leading-5 text-gray-500">
              Live map updates when your driver is moving. Drag the handle to resize this panel.
            </Text>
          ) : null}

          {canCancel ? (
            <Pressable
              onPress={() => void onCancel()}
              disabled={cancelling}
              android_ripple={{ color: 'rgba(127,29,29,0.15)' }}
              className="mt-8 items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-4 active:opacity-85 disabled:opacity-50">
              {cancelling ? (
                <ActivityIndicator color="#991b1b" />
              ) : (
                <Text className="text-base font-semibold text-red-900">Cancel request</Text>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
