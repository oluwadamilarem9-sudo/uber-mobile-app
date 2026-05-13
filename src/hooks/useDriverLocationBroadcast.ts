import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';

import { updateRideDriverLocation } from '@/src/lib/rideRequestMutations';

const MIN_INTERVAL_MS = 6000;

type Args = {
  requestId: string | undefined;
  driverId: string | undefined;
  /** When true, watch position and write `driverLocation` on the ride doc. */
  enabled: boolean;
};

/** Periodically publishes driver GPS to Firestore for the active trip (Phase 5). */
export function useDriverLocationBroadcast({ requestId, driverId, enabled }: Args) {
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (!enabled || !requestId || !driverId) {
      return;
    }

    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    void (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== Location.PermissionStatus.GRANTED || cancelled) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 35,
          timeInterval: MIN_INTERVAL_MS,
        },
        (pos) => {
          const now = Date.now();
          if (now - lastSentAt.current < MIN_INTERVAL_MS) {
            return;
          }
          lastSentAt.current = now;
          void updateRideDriverLocation(requestId, driverId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [driverId, enabled, requestId]);
}
