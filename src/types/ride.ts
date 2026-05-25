import type { RideProductId } from '@/src/lib/rideEstimates';

/** Matches PROJECT_INSTRUCTIONS ride lifecycle. */
export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arriving'
  | 'ongoing'
  | 'completed'
  /** Rider confirmed payment / settlement (synced in realtime for both parties). */
  | 'payment_complete'
  | 'cancelled';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type RideRequest = {
  id: string;
  riderId: string;
  riderName: string;
  pickup: GeoPoint;
  dropoff: GeoPoint;
  status: RideStatus;
  /** Set when a driver claims the request (matching). */
  driverId?: string | null;
  driverName?: string | null;
  /** Live driver position during active trip (Phase 5). */
  driverLocation?: GeoPoint | null;
  /** Rider-selected product (optional; stored for UI + history). */
  rideProductId?: RideProductId | null;
  /** Estimated fare in USD at request time (demo pricing). */
  fareEstimateUsd?: number | null;
  /** Estimated trip duration in minutes at request time. */
  etaMinutesGuess?: number | null;
  /** True when rider used in-app demo settlement (no payment processor). */
  paymentSimulated?: boolean | null;
  /** Rider’s 1–5 rating of the driver (after `payment_complete`). */
  riderRatingDriver?: number | null;
  riderRatingComment?: string | null;
  /** Driver’s 1–5 rating of the rider (after `payment_complete`). */
  driverRatingRider?: number | null;
  driverRatingComment?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};
