import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { fetchDrivingRoute, type LatLng } from '@/src/lib/directions';
import type { RideRequest } from '@/src/types/ride';

type Props = {
  ride: RideRequest;
  height: number;
};

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function toLatLng(p: { latitude: number; longitude: number }): LatLng {
  return { latitude: p.latitude, longitude: p.longitude };
}

export function RideTripMap({ ride, height }: Props) {
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routing, setRouting] = useState(false);

  const routeEndpoints = useMemo(() => {
    const driver = ride.driverLocation ? toLatLng(ride.driverLocation) : null;
    if (ride.status === 'accepted' || ride.status === 'arriving') {
      if (driver) {
        return { from: driver, to: toLatLng(ride.pickup) };
      }
      return { from: toLatLng(ride.pickup), to: toLatLng(ride.dropoff) };
    }
    if (ride.status === 'ongoing' && driver) {
      return { from: driver, to: toLatLng(ride.dropoff) };
    }
    return { from: toLatLng(ride.pickup), to: toLatLng(ride.dropoff) };
  }, [
    ride.status,
    ride.pickup.latitude,
    ride.pickup.longitude,
    ride.dropoff.latitude,
    ride.dropoff.longitude,
    ride.driverLocation?.latitude,
    ride.driverLocation?.longitude,
  ]);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) {
      setRouteCoords([]);
      return;
    }
    let cancelled = false;
    const { from, to } = routeEndpoints;
    const same =
      from.latitude === to.latitude && from.longitude === to.longitude;
    if (same) {
      setRouteCoords([]);
      return;
    }

    setRouting(true);
    const t = setTimeout(() => {
      void fetchDrivingRoute(from, to, GOOGLE_MAPS_KEY)
        .then((coords) => {
          if (!cancelled) {
            setRouteCoords(coords);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRouteCoords([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setRouting(false);
          }
        });
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    routeEndpoints.from.latitude,
    routeEndpoints.from.longitude,
    routeEndpoints.to.latitude,
    routeEndpoints.to.longitude,
  ]);

  const initialRegion: Region = useMemo(() => {
    const pts = [ride.pickup, ride.dropoff, ride.driverLocation].filter(Boolean) as {
      latitude: number;
      longitude: number;
    }[];
    const lat = pts.reduce((s, p) => s + p.latitude, 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p.longitude, 0) / pts.length;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [
    ride.pickup.latitude,
    ride.pickup.longitude,
    ride.dropoff.latitude,
    ride.dropoff.longitude,
    ride.driverLocation?.latitude,
    ride.driverLocation?.longitude,
  ]);

  return (
    <View style={{ height }} className="overflow-hidden rounded-2xl bg-gray-100">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={GOOGLE_MAPS_KEY ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={Platform.OS !== 'web'}
        showsMyLocationButton={Platform.OS === 'android'}>
        <Marker coordinate={toLatLng(ride.pickup)} title="Pickup" pinColor="#22c55e" />
        <Marker coordinate={toLatLng(ride.dropoff)} title="Drop-off" pinColor="#ef4444" />
        {ride.driverLocation ? (
          <Marker coordinate={toLatLng(ride.driverLocation)} title="Driver" pinColor="#F5C400" />
        ) : null}
        {routeCoords.length > 1 ? (
          <Polyline coordinates={routeCoords} strokeColor="#111827" strokeWidth={4} />
        ) : null}
      </MapView>
      {routing ? (
        <View className="absolute left-0 right-0 top-3 items-center">
          <View className="rounded-full bg-white/95 px-3 py-2 shadow">
            <ActivityIndicator color="#F5C400" />
          </View>
        </View>
      ) : null}
      {!GOOGLE_MAPS_KEY ? (
        <View className="absolute bottom-2 left-2 right-2 rounded-lg bg-white/90 px-2 py-1">
          <Text className="text-center text-xs text-gray-600">
            Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for turn-by-turn polylines.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
