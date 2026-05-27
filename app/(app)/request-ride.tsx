import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceSearchField } from '@/components/ride/PlaceSearchField';
import { RideProductPicker } from '@/components/ride/RideProductPicker';
import { SkeletonBox } from '@/components/ui/Skeleton';
import { FadeInView } from '@/components/ui/FadeInView';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useForegroundLocation } from '@/src/hooks/useForegroundLocation';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import type { LatLng } from '@/src/lib/directions';
import { formatMoney } from '@/src/lib/currency';
import {
  loadRecentDestinations,
  loadSavedPlaces,
  addSavedPlace,
  pushRecentDestination,
  type StoredPlace,
} from '@/src/lib/localRidePreferences';
import { estimateTrip, RIDE_PRODUCTS, type RideProductId } from '@/src/lib/rideEstimates';
import { reverseGeocode } from '@/src/lib/placesAutocomplete';
import { GOOGLE_MAPS_KEY } from '@/src/lib/mapConfig';
import { createRideRequest } from '@/src/lib/rideRequestMutations';
import { useAuthStore } from '@/src/stores/authStore';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

function emptyEstimates(): Record<RideProductId, { fareUsd: number; minutes: number }> {
  return RIDE_PRODUCTS.reduce(
    (acc, p) => {
      acc[p.id] = { fareUsd: p.fareUsd, minutes: 0 };
      return acc;
    },
    {} as Record<RideProductId, { fareUsd: number; minutes: number }>,
  );
}

export default function RequestRideScreen() {
  const router = useRouter();
  const currency = usePreferencesStore((s) => s.currency);
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid ?? '';
  const { data: profile } = useUserProfile(uid);
  const { state: locState, refresh } = useForegroundLocation();

  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [pickupLabel, setPickupLabel] = useState('Your location');
  const [dropoff, setDropoff] = useState<LatLng | null>(null);
  const [dropoffLabel, setDropoffLabel] = useState('');
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
    setPickup(locState.coords);
    if (GOOGLE_MAPS_KEY) {
      void reverseGeocode(locState.coords.latitude, locState.coords.longitude, GOOGLE_MAPS_KEY).then(
        setPickupLabel,
      );
    } else {
      setPickupLabel('Current location');
    }
  }, [locState]);

  const riderName =
    profile?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || 'Rider';

  const estimates = useMemo(() => {
    const out = emptyEstimates();
    if (!pickup || !dropoff) {
      return out;
    }
    for (const p of RIDE_PRODUCTS) {
      const e = estimateTrip(pickup, dropoff, p);
      out[p.id] = { fareUsd: e.fareUsd, minutes: e.minutes };
    }
    return out;
  }, [pickup, dropoff]);

  const selectedEstimate = estimates[productId];

  const applyDropoff = useCallback((p: StoredPlace) => {
    setDropoff({ latitude: p.latitude, longitude: p.longitude });
    setDropoffLabel(p.label);
  }, []);

  const saveDropoff = useCallback(async () => {
    if (!dropoff || !dropoffLabel.trim()) {
      Alert.alert('Drop-off', 'Search and select a destination first.');
      return;
    }
    await addSavedPlace({
      label: dropoffLabel.trim(),
      latitude: dropoff.latitude,
      longitude: dropoff.longitude,
    });
    setSaved(await loadSavedPlaces());
    Alert.alert('Saved', 'Destination added to saved places.');
  }, [dropoff, dropoffLabel]);

  const onSubmit = async () => {
    if (!hasFirebaseConfig || !uid) {
      Alert.alert('Not available', 'Sign in and connect OtterRide cloud to request a ride.');
      return;
    }
    if (!pickup || !dropoff) {
      Alert.alert('Locations', 'Set pickup and destination using search.');
      return;
    }

    setBusy(true);
    try {
      const id = await createRideRequest({
        riderId: uid,
        riderName,
        pickup,
        dropoff,
        pickupLabel: pickupLabel.trim() || undefined,
        dropoffLabel: dropoffLabel.trim() || undefined,
        rideProductId: productId,
        fareEstimateUsd: selectedEstimate.fareUsd,
        etaMinutesGuess: selectedEstimate.minutes,
      });
      await pushRecentDestination({
        label: dropoffLabel.trim() || 'Destination',
        latitude: dropoff.latitude,
        longitude: dropoff.longitude,
      });
      router.replace({ pathname: '/(app)/ride/[id]', params: { id } });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not create request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Request ride',
          headerShown: true,
          headerStyle: { backgroundColor: '#F5F5F5' },
          headerTintColor: '#1A1A1A',
          headerTitleStyle: { fontWeight: '700', color: '#1A1A1A' },
        }}
      />
      <KeyboardAvoidingView
        className="flex-1 bg-surface"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['bottom']} className="flex-1">
          <ScrollView
            className="flex-1 px-5"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}>
            <FadeInView>
              <Text className="text-[28px] font-bold text-ink">Where to?</Text>
              <Text className="mt-1 text-[15px] leading-5 text-gray-500">
                Search by place name — prices are fixed and shown in {currency}.
              </Text>

              {!prefsLoaded ? (
                <View className="mt-6 gap-2">
                  <SkeletonBox className="h-20 w-full" />
                  <SkeletonBox className="h-20 w-full" />
                </View>
              ) : (
                <View className="mt-6 gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-black/8">
                  <PlaceSearchField
                    label="Pickup"
                    placeholder="Search pickup location"
                    value={pickupLabel}
                    onChangeLabel={setPickupLabel}
                    onSelectPlace={(c, lbl) => {
                      setPickup(c);
                      setPickupLabel(lbl);
                    }}
                    bias={pickup ?? undefined}
                    dotColor="#22c55e"
                  />
                  <View className="ml-1.5 h-4 border-l-2 border-dashed border-gray-200" />
                  <PlaceSearchField
                    label="Destination"
                    placeholder="Search destination"
                    value={dropoffLabel}
                    onChangeLabel={setDropoffLabel}
                    onSelectPlace={(c, lbl) => {
                      setDropoff(c);
                      setDropoffLabel(lbl);
                    }}
                    bias={pickup ?? undefined}
                    dotColor="#ef4444"
                  />

                  {(locState.status === 'denied' || locState.status === 'error') && (
                    <Pressable onPress={() => void refresh()} className="mt-1 active:opacity-70">
                      <Text className="text-sm font-semibold text-primary underline">
                        {locState.message} — retry GPS
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {recent.length > 0 ? (
                <View className="mt-5">
                  <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Recent
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                    <View className="flex-row gap-2 pb-1">
                      {recent.map((p) => (
                        <Pressable
                          key={p.id}
                          onPress={() => applyDropoff(p)}
                          className="max-w-[180px] rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm active:opacity-90">
                          <FontAwesome name="history" size={14} color="#6b7280" />
                          <Text className="mt-1 text-xs font-semibold text-ink" numberOfLines={2}>
                            {p.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ) : null}

              {dropoff ? (
                <View className="mt-6">
                  <RideProductPicker
                    products={RIDE_PRODUCTS}
                    selectedId={productId}
                    onSelect={setProductId}
                    estimates={estimates}
                    currencyCode={currency}
                  />
                </View>
              ) : null}

              <View className="mt-6 rounded-3xl border border-primary/25 bg-primary/10 px-4 py-4">
                <Text className="text-xs font-bold uppercase tracking-widest text-gray-600">
                  Trip summary
                </Text>
                <Text className="mt-2 text-2xl font-bold text-ink">
                  {dropoff
                    ? formatMoney(selectedEstimate.fareUsd, currency)
                    : '—'}
                </Text>
                <Text className="mt-1 text-sm text-gray-600">
                  {dropoff ? `~${selectedEstimate.minutes} min · ${productId.replace('_', ' ')}` : 'Select a destination'}
                </Text>
              </View>

              <Pressable
                onPress={() => void saveDropoff()}
                className="mt-4 self-start rounded-xl px-1 py-2 active:opacity-80">
                <Text className="text-sm font-bold text-ink underline">Save destination</Text>
              </Pressable>

              <Pressable
                onPress={() => void onSubmit()}
                disabled={busy || !pickup || !dropoff}
                className="mt-6 items-center justify-center rounded-3xl bg-primary py-4 shadow-md shadow-amber-900/20 active:opacity-95 disabled:opacity-50">
                {busy ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text className="text-center text-base font-bold text-ink">Confirm & request ride</Text>
                )}
              </Pressable>

              <Link href="/(app)/trip-history" asChild>
                <Pressable className="mt-4 items-center py-2 active:opacity-80">
                  <Text className="text-sm font-bold text-ink underline">Trip history</Text>
                </Pressable>
              </Link>
            </FadeInView>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
