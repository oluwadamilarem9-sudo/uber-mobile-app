import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { useForegroundLocation } from '@/src/hooks/useForegroundLocation';
import { fetchDrivingRoute, type LatLng } from '@/src/lib/directions';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export function ExploreMapScreen() {
  const mapRef = useRef<MapView>(null);
  const { state: locState, refresh } = useForegroundLocation();
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routing, setRouting] = useState(false);

  const origin = locState.status === 'ready' ? locState.coords : null;

  useEffect(() => {
    if (!origin || !mapRef.current) {
      return;
    }
    mapRef.current.animateToRegion(
      {
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      },
      450,
    );
  }, [origin?.latitude, origin?.longitude]);

  const initialRegion: Region | undefined = useMemo(() => {
    if (origin) {
      return {
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };
    }
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [origin]);

  const onMapPress = useCallback((e: { nativeEvent: { coordinate: LatLng } }) => {
    setDestination(e.nativeEvent.coordinate);
    setRouteCoords([]);
  }, []);

  const onBuildRoute = useCallback(async () => {
    if (!origin || !destination) {
      Alert.alert('Need two points', 'Wait for your location, then tap the map to set a destination.');
      return;
    }
    if (!GOOGLE_MAPS_KEY) {
      Alert.alert(
        'API key missing',
        'Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to `.env` and enable Directions API + Maps SDK in Google Cloud.',
      );
      return;
    }
    setRouting(true);
    try {
      const coords = await fetchDrivingRoute(origin, destination, GOOGLE_MAPS_KEY);
      setRouteCoords(coords);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Route failed';
      Alert.alert('Route error', message);
      setRouteCoords([]);
    } finally {
      setRouting(false);
    }
  }, [origin, destination]);

  const onClear = useCallback(() => {
    setDestination(null);
    setRouteCoords([]);
  }, []);

  if (locState.status === 'denied' || locState.status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-base text-gray-800">{locState.message}</Text>
        <Pressable onPress={() => void refresh()} className="mt-6 rounded-xl bg-primary px-6 py-3">
          <Text className="font-semibold text-gray-900">Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={GOOGLE_MAPS_KEY ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={Platform.OS === 'android'}
        onPress={onMapPress}>
        {origin ? (
          <Marker coordinate={origin} title="You" pinColor="#F5C400" />
        ) : null}
        {destination ? <Marker coordinate={destination} title="Destination" /> : null}
        {routeCoords.length > 1 ? (
          <Polyline coordinates={routeCoords} strokeColor="#111827" strokeWidth={4} />
        ) : null}
      </MapView>

      {locState.status === 'requesting' ? (
        <View className="absolute left-0 right-0 top-14 items-center">
          <View className="rounded-full bg-white px-4 py-2 shadow">
            <ActivityIndicator color="#F5C400" />
          </View>
        </View>
      ) : null}

      <View className="absolute bottom-8 left-4 right-4 gap-2 rounded-2xl bg-white/95 p-4 shadow">
        <Text className="text-sm text-gray-700">
          Tap the map to drop a <Text className="font-semibold">destination</Text>. Then build a driving
          route (Google Directions).
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => void refresh()}
            className="flex-1 min-w-[44%] items-center rounded-xl border border-gray-200 bg-secondary py-3">
            <Text className="font-semibold text-gray-900">Refresh location</Text>
          </Pressable>
          <Pressable
            disabled={routing}
            onPress={() => void onBuildRoute()}
            className="flex-1 min-w-[44%] items-center rounded-xl bg-primary py-3 opacity-100 disabled:opacity-50">
            <Text className="font-semibold text-gray-900">{routing ? 'Routing…' : 'Show route'}</Text>
          </Pressable>
          <Pressable
            onPress={onClear}
            className="w-full items-center rounded-xl border border-gray-200 py-3">
            <Text className="font-semibold text-gray-700">Clear destination & route</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
