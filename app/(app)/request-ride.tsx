import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { FadeInView } from '@/components/ui/FadeInView';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useForegroundLocation } from '@/src/hooks/useForegroundLocation';
import { useUserProfile } from '@/src/hooks/useUserProfile';
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
  const pickupSeededRef = useRef(false);

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

  const onSubmit = async () => {
    if (!hasFirebaseConfig || !uid) {
      Alert.alert('Firebase', 'Configure `.env` and sign in to request a ride.');
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

    setBusy(true);
    try {
      const id = await createRideRequest({
        riderId: uid,
        riderName,
        pickup: { latitude: plat, longitude: plng },
        dropoff: { latitude: dlat, longitude: dlng },
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
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          className="flex-1 px-5 pt-2"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}>
          <FadeInView>
            <Text className="text-sm leading-5 text-gray-600">
              Pickup defaults to your current location when permission is granted. Adjust coordinates
              if needed.
            </Text>

            {(locState.status === 'denied' || locState.status === 'error') && (
              <Pressable
                onPress={() => void refresh()}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                className="mt-3 self-start rounded-lg px-1 py-2 active:opacity-70">
                <Text className="text-sm font-semibold text-amber-800 underline">
                  {locState.message} — tap to retry
                </Text>
              </Pressable>
            )}

            <Text className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pickup
            </Text>
            <TextInput
              className="mt-1 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 shadow-sm"
              keyboardType="numbers-and-punctuation"
              value={pickupLat}
              onChangeText={setPickupLat}
              placeholder="Latitude"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              className="mt-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 shadow-sm"
              keyboardType="numbers-and-punctuation"
              value={pickupLng}
              onChangeText={setPickupLng}
              placeholder="Longitude"
              placeholderTextColor="#9ca3af"
            />

            <Text className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Drop-off
            </Text>
            <TextInput
              className="mt-1 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 shadow-sm"
              keyboardType="numbers-and-punctuation"
              value={dropLat}
              onChangeText={setDropLat}
              placeholder="Latitude"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              className="mt-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 shadow-sm"
              keyboardType="numbers-and-punctuation"
              value={dropLng}
              onChangeText={setDropLng}
              placeholder="Longitude"
              placeholderTextColor="#9ca3af"
            />

            <Pressable
              onPress={() => void onSubmit()}
              disabled={busy}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              className="mt-8 items-center justify-center rounded-2xl bg-gray-900 py-4 shadow-md shadow-gray-900/25 active:opacity-95 disabled:opacity-50">
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">Request ride</Text>
              )}
            </Pressable>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
