import { decodeEncodedPolyline } from '@/src/lib/polylineDecode';

export type LatLng = { latitude: number; longitude: number };

type DirectionsResponse = {
  routes?: { overview_polyline?: { points?: string } }[];
  status: string;
  error_message?: string;
};

export async function fetchDrivingRoute(
  origin: LatLng,
  destination: LatLng,
  apiKey: string,
): Promise<LatLng[]> {
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for Directions.');
  }

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    originStr,
  )}&destination=${encodeURIComponent(destStr)}&mode=driving&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Directions request failed (${res.status})`);
  }

  const json = (await res.json()) as DirectionsResponse;
  if (json.status !== 'OK' || !json.routes?.length) {
    const msg = json.error_message ?? json.status;
    throw new Error(msg || 'No route returned');
  }

  const encoded = json.routes[0]?.overview_polyline?.points;
  if (!encoded) {
    throw new Error('Route has no polyline');
  }

  return decodeEncodedPolyline(encoded);
}
