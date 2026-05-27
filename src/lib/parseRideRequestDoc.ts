import type { RideProductId } from '@/src/lib/rideEstimates';
import type { GeoPoint, RideRequest } from '@/src/types/ride';

function parseRideProductId(v: unknown): RideProductId | null | undefined {
  if (v === undefined) {
    return undefined;
  }
  if (v === null) {
    return null;
  }
  if (
    v === 'otter_x' ||
    v === 'otter_comfort' ||
    v === 'otter_xl' ||
    v === 'otter_premium' ||
    v === 'otter_green' ||
    v === 'otter_shared'
  ) {
    return v;
  }
  return null;
}

function parseGeo(v: unknown): GeoPoint | undefined {
  if (!v || typeof v !== 'object') {
    return undefined;
  }
  const m = v as Record<string, unknown>;
  const lat = m.latitude;
  const lng = m.longitude;
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { latitude: lat, longitude: lng };
  }
  return undefined;
}

function parseDriverLocationField(
  data: Record<string, unknown>,
): GeoPoint | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(data, 'driverLocation')) {
    return undefined;
  }
  const v = data.driverLocation;
  if (v === null) {
    return null;
  }
  return parseGeo(v);
}

export function parseRideRequestDoc(id: string, data: Record<string, unknown>): RideRequest | null {
  const riderId = typeof data.riderId === 'string' ? data.riderId : '';
  const riderName = typeof data.riderName === 'string' ? data.riderName : '';
  const status = data.status as RideRequest['status'];
  const pickup = data.pickup as RideRequest['pickup'] | undefined;
  const dropoff = data.dropoff as RideRequest['dropoff'] | undefined;
  if (!riderId || !pickup || !dropoff || !status) {
    return null;
  }
  const allowed: RideRequest['status'][] = [
    'requested',
    'accepted',
    'arriving',
    'ongoing',
    'completed',
    'payment_complete',
    'cancelled',
  ];
  if (!allowed.includes(status)) {
    return null;
  }
  return {
    id,
    riderId,
    riderName,
    pickup,
    dropoff,
    pickupLabel: typeof data.pickupLabel === 'string' ? data.pickupLabel : null,
    dropoffLabel: typeof data.dropoffLabel === 'string' ? data.dropoffLabel : null,
    status,
    driverId: typeof data.driverId === 'string' ? data.driverId : null,
    driverName: typeof data.driverName === 'string' ? data.driverName : null,
    driverLocation: parseDriverLocationField(data),
    rideProductId: parseRideProductId(data.rideProductId),
    fareEstimateUsd: typeof data.fareEstimateUsd === 'number' ? data.fareEstimateUsd : null,
    etaMinutesGuess: typeof data.etaMinutesGuess === 'number' ? data.etaMinutesGuess : null,
    paymentSimulated: typeof data.paymentSimulated === 'boolean' ? data.paymentSimulated : null,
    riderRatingDriver:
      typeof data.riderRatingDriver === 'number' && data.riderRatingDriver >= 1 && data.riderRatingDriver <= 5
        ? data.riderRatingDriver
        : null,
    riderRatingComment:
      typeof data.riderRatingComment === 'string' ? data.riderRatingComment : null,
    driverRatingRider:
      typeof data.driverRatingRider === 'number' &&
      data.driverRatingRider >= 1 &&
      data.driverRatingRider <= 5
        ? data.driverRatingRider
        : null,
    driverRatingComment:
      typeof data.driverRatingComment === 'string' ? data.driverRatingComment : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
