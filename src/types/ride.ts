/** Matches PROJECT_INSTRUCTIONS ride lifecycle. */
export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arriving'
  | 'ongoing'
  | 'completed'
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
  createdAt?: unknown;
  updatedAt?: unknown;
};
