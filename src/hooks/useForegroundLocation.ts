import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LatLng } from '@/src/lib/directions';

type State =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'ready'; coords: LatLng }
  | { status: 'denied'; message: string }
  | { status: 'error'; message: string };

type Options = {
  /** After the first fix, subscribe to GPS updates (Explore map “live” mode). */
  watch?: boolean;
};

export function useForegroundLocation(opts?: Options) {
  const watch = opts?.watch ?? false;
  const [state, setState] = useState<State>({ status: 'idle' });
  const watchSubRef = useRef<Location.LocationSubscription | undefined>(undefined);

  const refresh = useCallback(async () => {
    setState({ status: 'requesting' });
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== Location.PermissionStatus.GRANTED) {
        setState({ status: 'denied', message: 'Location permission was not granted.' });
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setState({
        status: 'ready',
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not read location';
      setState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;

    if (!watch || state.status !== 'ready') {
      watchSubRef.current?.remove();
      watchSubRef.current = undefined;
      return () => {
        watchSubRef.current?.remove();
        watchSubRef.current = undefined;
      };
    }

    void (async () => {
      watchSubRef.current?.remove();
      watchSubRef.current = undefined;
      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 18,
            timeInterval: 6000,
          },
          (pos) => {
            if (cancelled) {
              return;
            }
            setState({
              status: 'ready',
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              },
            });
          },
        );
        if (cancelled) {
          sub.remove();
          return;
        }
        watchSubRef.current = sub;
      } catch {
        /* keep last good fix */
      }
    })();

    return () => {
      cancelled = true;
      watchSubRef.current?.remove();
      watchSubRef.current = undefined;
    };
  }, [watch, state.status]);

  return { state, refresh };
}
