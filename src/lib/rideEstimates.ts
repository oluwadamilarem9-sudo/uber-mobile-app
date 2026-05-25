import { haversineKm } from '@/src/lib/geo';

export type RideProductId = 'otter_x' | 'otter_comfort' | 'otter_xl';

export type RideProduct = {
  id: RideProductId;
  name: string;
  description: string;
  seats: number;
  /** Multiplier on base distance fare. */
  fareMultiplier: number;
  /** Typical ETA factor vs baseline trip minutes. */
  etaFactor: number;
};

export const RIDE_PRODUCTS: RideProduct[] = [
  {
    id: 'otter_x',
    name: 'OtterX',
    description: 'Affordable everyday rides',
    seats: 4,
    fareMultiplier: 1,
    etaFactor: 1,
  },
  {
    id: 'otter_comfort',
    name: 'OtterComfort',
    description: 'Extra legroom, newer cars',
    seats: 4,
    fareMultiplier: 1.25,
    etaFactor: 0.95,
  },
  {
    id: 'otter_xl',
    name: 'OtterXL',
    description: 'Groups & extra luggage',
    seats: 6,
    fareMultiplier: 1.55,
    etaFactor: 1.05,
  },
];

export function getRideProduct(id: RideProductId): RideProduct {
  return RIDE_PRODUCTS.find((p) => p.id === id) ?? RIDE_PRODUCTS[0];
}

/**
 * Simple startup-style fare: base + per-km, clamped for sanity (no surge).
 * Good enough for learning / demo; swap for server pricing later.
 */
export function estimateTripUsd(
  pickup: { latitude: number; longitude: number },
  dropoff: { latitude: number; longitude: number },
  product: RideProduct,
): { distanceKm: number; minutes: number; fareUsd: number } {
  const distanceKm = haversineKm(pickup, dropoff);
  const baselineMinutes = Math.max(4, Math.round((distanceKm / 22) * 60));
  const minutes = Math.max(3, Math.round(baselineMinutes * product.etaFactor));
  const base = 2.8 + distanceKm * 1.35;
  const fareUsd = Math.round(base * product.fareMultiplier * 10) / 10;
  const clamped = Math.min(89, Math.max(6.5, fareUsd));
  return { distanceKm, minutes, fareUsd: clamped };
}
