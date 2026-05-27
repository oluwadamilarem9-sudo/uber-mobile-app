import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { fetchDrivingRoute, type LatLng } from '@/src/lib/directions';
import type { RideRequest } from '@/src/types/ride';

type Props = {
  ride: RideRequest;
  /** Full-bleed map behind UI chrome. */
  fullScreen?: boolean;
  /** Card height when not fullScreen. */
  height?: number;
  /** Simulated nearby vehicles while status is `requested`. */
  ghostCars?: LatLng[];
};

import { GOOGLE_MAPS_KEY, MAP_FEATURES, MAP_PROVIDER } from '@/src/lib/mapConfig';

function toLatLng(p: { latitude: number; longitude: number }): LatLng {
  return { latitude: p.latitude, longitude: p.longitude };
}

export function RideTripMap({ ride, fullScreen, height = 220, ghostCars }: Props) {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routing, setRouting] = useState(false);

  const driverPoint = ride.driverLocation ? toLatLng(ride.driverLocation) : null;

  const routeEndpoints = useMemo(() => {
    const driver = driverPoint;
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
    driverPoint?.latitude,
    driverPoint?.longitude,
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
        .then((route) => {
          if (!cancelled) {
            setRouteCoords(route.coordinates);
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
    }, 650);

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
    const lat = pts.reduce((s, p) => s + p.latitude, 0) / Math.max(1, pts.length);
    const lng = pts.reduce((s, p) => s + p.longitude, 0) / Math.max(1, pts.length);
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

  const mapStyle = fullScreen ? StyleSheet.absoluteFillObject : { height };

  return (
    <View style={mapStyle} className={fullScreen ? '' : 'overflow-hidden rounded-2xl bg-gray-100'}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={MAP_PROVIDER}
        initialRegion={initialRegion}
        showsUserLocation={Platform.OS !== 'web'}
        showsMyLocationButton={Platform.OS === 'android'}
        showsTraffic={fullScreen === true && MAP_FEATURES.traffic}
        loadingEnabled
        >
        <Marker coordinate={toLatLng(ride.pickup)} title="Pickup" pinColor="#22c55e" />
        <Marker coordinate={toLatLng(ride.dropoff)} title="Drop-off" pinColor="#ef4444" />
        {ghostCars?.map((g, i) => (
          <Marker key={`ghost-${i}`} coordinate={g} title="Nearby" opacity={0.85} pinColor="#9ca3af" />
        ))}
        {driverPoint ? (
          <Marker coordinate={driverPoint} title="Driver" pinColor="#FFCC00" />
        ) : null}
        {routeCoords.length > 1 ? (
          <Polyline coordinates={routeCoords} strokeColor="#111827" strokeWidth={4} />
        ) : null}
      </MapView>
      {routing ? (
        <View className="absolute left-0 right-0 top-3 items-center">
          <View className="rounded-full border border-gray-100 bg-white/95 px-3 py-2 shadow">
            <ActivityIndicator color="#FFCC00" />
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
