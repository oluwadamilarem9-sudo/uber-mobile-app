import { decodeEncodedPolyline } from '@/src/lib/polylineDecode';

export type LatLng = { latitude: number; longitude: number };

export type RouteMode = 'driving' | 'walking' | 'bicycling' | 'transit';

export type DrivingRoute = {
  coordinates: LatLng[];
  /** Total travel time (seconds) across all legs. */
  durationSec: number;
  /** Total distance (meters) across all legs. */
  distanceMeters: number;
  mode: RouteMode;
};

type DirectionsResponse = {
  routes?: {
    overview_polyline?: { points?: string };
    legs?: { duration?: { value?: number }; distance?: { value?: number } }[];
  }[];
  status: string;
  error_message?: string;
};

export async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  apiKey: string,
  mode: RouteMode = 'driving',
): Promise<DrivingRoute> {
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for Directions.');
  }

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    originStr,
  )}&destination=${encodeURIComponent(destStr)}&mode=${encodeURIComponent(mode)}&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Directions request failed (${res.status})`);
  }

  const json = (await res.json()) as DirectionsResponse;
  if (json.status !== 'OK' || !json.routes?.length) {
    const msg = json.error_message ?? json.status;
    throw new Error(msg || 'No route returned');
  }

  const route = json.routes[0];
  const encoded = route?.overview_polyline?.points;
  if (!encoded) {
    throw new Error('Route has no polyline');
  }

  let durationSec = 0;
  let distanceMeters = 0;
  for (const leg of route?.legs ?? []) {
    durationSec += leg.duration?.value ?? 0;
    distanceMeters += leg.distance?.value ?? 0;
  }

  return {
    coordinates: decodeEncodedPolyline(encoded),
    durationSec,
    distanceMeters,
    mode,
  };
}

/** @deprecated Use fetchRoute */
export async function fetchDrivingRoute(
  origin: LatLng,
  destination: LatLng,
  apiKey: string,
): Promise<DrivingRoute> {
  return fetchRoute(origin, destination, apiKey, 'driving');
}
