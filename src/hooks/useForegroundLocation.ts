import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { LatLng } from '@/src/lib/directions';

type State =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'ready'; coords: LatLng }
  | { status: 'denied'; message: string }
  | { status: 'error'; message: string };

export function useForegroundLocation() {
  const [state, setState] = useState<State>({ status: 'idle' });

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

  return { state, refresh };
}
