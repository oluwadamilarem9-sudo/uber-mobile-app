import { haversineKm } from '@/src/lib/geo';

export type RideProductId =
  | 'otter_x'
  | 'otter_comfort'
  | 'otter_xl'
  | 'otter_premium'
  | 'otter_green'
  | 'otter_shared';

export type RideProduct = {
  id: RideProductId;
  name: string;
  description: string;
  seats: number;
  /** Fixed USD fare for this product (deterministic, never random). */
  fareUsd: number;
  /** Typical ETA factor vs baseline trip minutes. */
  etaFactor: number;
  icon: 'automobile' | 'users' | 'leaf' | 'star' | 'exchange';
};

/** Max fare cap per product (USD). */
export const MAX_FARE_USD = 9.99;

export const RIDE_PRODUCTS: RideProduct[] = [
  {
    id: 'otter_x',
    name: 'OtterX',
    description: 'Affordable everyday rides',
    seats: 4,
    fareUsd: 4.99,
    etaFactor: 1,
    icon: 'automobile',
  },
  {
    id: 'otter_comfort',
    name: 'OtterComfort',
    description: 'Extra legroom, newer cars',
    seats: 4,
    fareUsd: 6.49,
    etaFactor: 0.95,
    icon: 'automobile',
  },
  {
    id: 'otter_xl',
    name: 'OtterXL',
    description: 'Groups & extra luggage',
    seats: 6,
    fareUsd: 7.99,
    etaFactor: 1.05,
    icon: 'users',
  },
  {
    id: 'otter_premium',
    name: 'OtterPremium',
    description: 'Executive sedans & quiet ride',
    seats: 4,
    fareUsd: 9.49,
    etaFactor: 0.9,
    icon: 'star',
  },
  {
    id: 'otter_green',
    name: 'OtterGreen',
    description: 'Hybrid & EV options',
    seats: 4,
    fareUsd: 5.99,
    etaFactor: 1.02,
    icon: 'leaf',
  },
  {
    id: 'otter_shared',
    name: 'OtterShared',
    description: 'Split fare with others',
    seats: 2,
    fareUsd: 3.49,
    etaFactor: 1.15,
    icon: 'exchange',
  },
];

export function getRideProduct(id: RideProductId): RideProduct {
  return RIDE_PRODUCTS.find((p) => p.id === id) ?? RIDE_PRODUCTS[0];
}

/**
 * Fixed realistic pricing: distance only affects ETA, not price (stable like a promo fare table).
 */
export function estimateTrip(
  pickup: { latitude: number; longitude: number },
  dropoff: { latitude: number; longitude: number },
  product: RideProduct,
): { distanceKm: number; minutes: number; fareUsd: number } {
  const distanceKm = haversineKm(pickup, dropoff);
  const baselineMinutes = Math.max(4, Math.round((distanceKm / 22) * 60));
  const minutes = Math.max(3, Math.round(baselineMinutes * product.etaFactor));
  const fareUsd = Math.min(MAX_FARE_USD, product.fareUsd);
  return { distanceKm, minutes, fareUsd };
}

/** @deprecated */
export function estimateTripUsd(
  pickup: { latitude: number; longitude: number },
  dropoff: { latitude: number; longitude: number },
  product: RideProduct,
) {
  return estimateTrip(pickup, dropoff, product);
}
