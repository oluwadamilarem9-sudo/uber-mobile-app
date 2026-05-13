import type { GeoPoint, RideRequest } from '@/src/types/ride';

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
  return {
    id,
    riderId,
    riderName,
    pickup,
    dropoff,
    status,
    driverId: typeof data.driverId === 'string' ? data.driverId : null,
    driverName: typeof data.driverName === 'string' ? data.driverName : null,
    driverLocation: parseDriverLocationField(data),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
