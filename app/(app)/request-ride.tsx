import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RideProductPicker } from '@/components/ride/RideProductPicker';
import { SkeletonBox } from '@/components/ui/Skeleton';
import { FadeInView } from '@/components/ui/FadeInView';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useForegroundLocation } from '@/src/hooks/useForegroundLocation';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import {
  loadRecentDestinations,
  loadSavedPlaces,
  addSavedPlace,
  pushRecentDestination,
  type StoredPlace,
} from '@/src/lib/localRidePreferences';
import { estimateTripUsd, RIDE_PRODUCTS, type RideProductId } from '@/src/lib/rideEstimates';
import { createRideRequest } from '@/src/lib/rideRequestMutations';
import { useAuthStore } from '@/src/stores/authStore';

function parseCoord(raw: string, fallback: number): number {
  const n = Number.parseFloat(raw.trim());
  return Number.isFinite(n) ? n : fallback;
}

export default function RequestRideScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid ?? '';
  const { data: profile } = useUserProfile(uid);
  const { state: locState, refresh } = useForegroundLocation();

  const [pickupLat, setPickupLat] = useState('37.7749');
  const [pickupLng, setPickupLng] = useState('-122.4194');
  const [dropLat, setDropLat] = useState('37.7899');
  const [dropLng, setDropLng] = useState('-122.4014');
  const [busy, setBusy] = useState(false);
  const [productId, setProductId] = useState<RideProductId>('otter_comfort');
  const [recent, setRecent] = useState<StoredPlace[]>([]);
  const [saved, setSaved] = useState<StoredPlace[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const pickupSeededRef = useRef(false);

  useEffect(() => {
    void (async () => {
      const [r, s] = await Promise.all([loadRecentDestinations(), loadSavedPlaces()]);
      setRecent(r);
      setSaved(s);
      setPrefsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (locState.status !== 'ready' || pickupSeededRef.current) {
      return;
    }
    pickupSeededRef.current = true;
    setPickupLat(String(locState.coords.latitude));
    setPickupLng(String(locState.coords.longitude));
  }, [locState]);

  const riderName =
    profile?.displayName?.trim() ||
    user?.email?.split('@')[0]?.trim() ||
    'Rider';

  const pickup = useMemo(
    () => ({
      latitude: parseCoord(pickupLat, NaN),
      longitude: parseCoord(pickupLng, NaN),
    }),
    [pickupLat, pickupLng],
  );
  const dropoff = useMemo(
    () => ({
      latitude: parseCoord(dropLat, NaN),
      longitude: parseCoord(dropLng, NaN),
    }),
    [dropLat, dropLng],
  );

  const estimates = useMemo(() => {
    const out: Record<RideProductId, { fareUsd: number; minutes: number }> = {
      otter_x: { fareUsd: 0, minutes: 0 },
      otter_comfort: { fareUsd: 0, minutes: 0 },
      otter_xl: { fareUsd: 0, minutes: 0 },
    };
    if (![pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude].every(Number.isFinite)) {
      return out;
    }
    for (const p of RIDE_PRODUCTS) {
      const e = estimateTripUsd(pickup, dropoff, p);
      out[p.id] = { fareUsd: e.fareUsd, minutes: e.minutes };
    }
    return out;
  }, [pickup, dropoff]);

  const saveDropoff = useCallback(async () => {
    const dlat = parseCoord(dropLat, NaN);
    const dlng = parseCoord(dropLng, NaN);
    if (!Number.isFinite(dlat) || !Number.isFinite(dlng)) {
      Alert.alert('Drop-off', 'Enter valid drop-off coordinates first.');
      return;
    }
    await addSavedPlace({
      label: `Saved ${dlat.toFixed(2)}, ${dlng.toFixed(2)}`,
      latitude: dlat,
      longitude: dlng,
    });
    setSaved(await loadSavedPlaces());
    Alert.alert('Saved', 'Drop-off added to your saved places.');
  }, [dropLat, dropLng]);

  const applyPlace = useCallback((p: StoredPlace) => {
    setDropLat(String(p.latitude));
    setDropLng(String(p.longitude));
  }, []);

  const onSubmit = async () => {
    if (!hasFirebaseConfig || !uid) {
      Alert.alert('Not available', 'Sign in and connect this app to OtterRide cloud to request a ride.');
      return;
    }
    const plat = parseCoord(pickupLat, NaN);
    const plng = parseCoord(pickupLng, NaN);
    const dlat = parseCoord(dropLat, NaN);
    const dlng = parseCoord(dropLng, NaN);
    if (![plat, plng, dlat, dlng].every(Number.isFinite)) {
      Alert.alert('Coordinates', 'Enter valid numbers for pickup and drop-off.');
      return;
    }

    const est = estimates[productId];
    setBusy(true);
    try {
      const id = await createRideRequest({
        riderId: uid,
        riderName,
        pickup: { latitude: plat, longitude: plng },
        dropoff: { latitude: dlat, longitude: dlng },
        rideProductId: productId,
        fareEstimateUsd: est.fareUsd,
        etaMinutesGuess: est.minutes,
      });
      await pushRecentDestination({
        label: `Drop ${dlat.toFixed(3)}, ${dlng.toFixed(3)}`,
        latitude: dlat,
        longitude: dlng,
      });
      router.replace({ pathname: '/(app)/ride/[id]', params: { id } });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not create request';
      Alert.alert('Error', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          className="flex-1 px-5 pt-2"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}>
          <FadeInView>
            <Text className="text-2xl font-bold text-ink">Where to?</Text>
            <Text className="mt-1 text-sm text-gray-600">
              Pick a ride type, confirm your pickup and destination, then send your request.
            </Text>

            {!prefsLoaded ? (
              <View className="mt-6 gap-2">
                <SkeletonBox className="h-16 w-full" />
                <SkeletonBox className="h-16 w-full" />
              </View>
            ) : (
              <>
                {recent.length > 0 ? (
                  <View className="mt-6">
                    <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Recent destinations
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                      <View className="flex-row gap-2 pb-1">
                        {recent.map((p) => (
                          <Pressable
                            key={p.id}
                            onPress={() => applyPlace(p)}
                            className="max-w-[160px] rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-sm active:opacity-90">
                            <FontAwesome name="clock-o" size={14} color="#6b7280" />
                            <Text className="mt-1 text-xs font-semibold text-ink" numberOfLines={2}>
                              {p.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

                {saved.length > 0 ? (
                  <View className="mt-5">
                    <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Saved places
                    </Text>
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {saved.map((p) => (
                        <Pressable
                          key={p.id}
                          onPress={() => applyPlace(p)}
                          className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 active:opacity-90">
                          <Text className="text-xs font-bold text-ink" numberOfLines={1}>
                            {p.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            )}

            <View className="mt-6 rounded-4xl border border-gray-100 bg-white p-5 shadow-lg shadow-black/8">
              <RideProductPicker
                products={RIDE_PRODUCTS}
                selectedId={productId}
                onSelect={setProductId}
                estimates={estimates}
              />

              <Text className="mt-8 text-xs font-bold uppercase tracking-wide text-gray-500">Pickup</Text>
              <TextInput
                className="mt-2 rounded-3xl border border-gray-200 bg-surface px-4 py-3.5 text-base text-ink"
                keyboardType="numbers-and-punctuation"
                value={pickupLat}
                onChangeText={setPickupLat}
                placeholder="Latitude"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                className="mt-2 rounded-3xl border border-gray-200 bg-surface px-4 py-3.5 text-base text-ink"
                keyboardType="numbers-and-punctuation"
                value={pickupLng}
                onChangeText={setPickupLng}
                placeholder="Longitude"
                placeholderTextColor="#9ca3af"
              />

              <Text className="mt-6 text-xs font-bold uppercase tracking-wide text-gray-500">Drop-off</Text>
              <TextInput
                className="mt-2 rounded-3xl border border-gray-200 bg-surface px-4 py-3.5 text-base text-ink"
                keyboardType="numbers-and-punctuation"
                value={dropLat}
                onChangeText={setDropLat}
                placeholder="Latitude"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                className="mt-2 rounded-3xl border border-gray-200 bg-surface px-4 py-3.5 text-base text-ink"
                keyboardType="numbers-and-punctuation"
                value={dropLng}
                onChangeText={setDropLng}
                placeholder="Longitude"
                placeholderTextColor="#9ca3af"
              />

              <Pressable
                onPress={() => void saveDropoff()}
                className="mt-3 self-start rounded-xl px-1 py-2 active:opacity-80">
                <Text className="text-sm font-bold text-ink underline">Save this drop-off</Text>
              </Pressable>

              {(locState.status === 'denied' || locState.status === 'error') && (
                <Pressable
                  onPress={() => void refresh()}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  className="mt-4 self-start rounded-lg px-1 py-2 active:opacity-70">
                  <Text className="text-sm font-semibold text-ink underline">
                    {locState.message} — tap to retry GPS
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => void onSubmit()}
                disabled={busy}
                android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                className="mt-8 items-center justify-center rounded-3xl bg-primary py-4 shadow-md shadow-amber-900/20 active:opacity-95 disabled:opacity-50">
                {busy ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text className="text-base font-bold text-ink">Confirm & request ride</Text>
                )}
              </Pressable>

              <Link href="/(app)/trip-history" asChild>
                <Pressable className="mt-4 items-center py-2 active:opacity-80">
                  <Text className="text-sm font-bold text-ink underline">View trip history</Text>
                </Pressable>
              </Link>
            </View>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
