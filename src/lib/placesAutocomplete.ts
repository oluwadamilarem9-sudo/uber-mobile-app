import type { LatLng } from '@/src/lib/directions';

export type PlacePrediction = {
  placeId: string;
  description: string;
  /** Short name when returned by API */
  mainText?: string;
  secondaryText?: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: LatLng;
};

type AutocompleteJson = {
  predictions?: {
    place_id?: string;
    description?: string;
    structured_formatting?: { main_text?: string; secondary_text?: string };
  }[];
  status: string;
  error_message?: string;
};

type DetailsJson = {
  result?: {
    name?: string;
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
  };
  status: string;
  error_message?: string;
};

type GeocodeJson = {
  results?: { formatted_address?: string; place_id?: string }[];
  status: string;
  error_message?: string;
};

/** Google Maps–style search: addresses, businesses, landmarks (not geocode-only). */
export async function fetchPlacePredictions(
  input: string,
  apiKey: string,
  bias?: LatLng,
): Promise<PlacePrediction[]> {
  const q = input.trim();
  if (!q || !apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    input: q,
    key: apiKey,
  });
  if (bias) {
    params.set('location', `${bias.latitude},${bias.longitude}`);
    params.set('radius', '80000');
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Autocomplete failed (${res.status})`);
  }

  const json = (await res.json()) as AutocompleteJson;
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(json.error_message ?? json.status);
  }

  return (json.predictions ?? [])
    .filter((p) => p.place_id && p.description)
    .map((p) => ({
      placeId: p.place_id as string,
      description: p.description as string,
      mainText: p.structured_formatting?.main_text,
      secondaryText: p.structured_formatting?.secondary_text,
    }));
}

export async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails | null> {
  if (!placeId || !apiKey) {
    return null;
  }

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'name,formatted_address,geometry',
    key: apiKey,
  });
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Place details failed (${res.status})`);
  }

  const json = (await res.json()) as DetailsJson;
  if (json.status !== 'OK' || !json.result?.geometry?.location) {
    return null;
  }

  const loc = json.result.geometry.location;
  return {
    placeId,
    name: json.result.name ?? json.result.formatted_address ?? 'Selected place',
    formattedAddress: json.result.formatted_address ?? '',
    location: { latitude: loc.lat, longitude: loc.lng },
  };
}

export async function fetchPlaceLatLng(placeId: string, apiKey: string): Promise<LatLng | null> {
  const details = await fetchPlaceDetails(placeId, apiKey);
  return details?.location ?? null;
}

/** Resolve map tap coordinates to a human-readable place name. */
export async function reverseGeocode(lat: number, lng: number, apiKey: string): Promise<string> {
  if (!apiKey) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: apiKey,
  });
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  const json = (await res.json()) as GeocodeJson;
  if (json.status !== 'OK' || !json.results?.length) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  return json.results[0].formatted_address ?? 'Dropped pin';
}
