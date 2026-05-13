import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { getFirestoreDb } from '@/src/firebase/firestore';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { parseRideRequestDoc } from '@/src/lib/parseRideRequestDoc';
import type { RideRequest } from '@/src/types/ride';

/** Realtime updates for a single ride request (rider or driver). */
export function useRideRequestSubscription(requestId: string | undefined) {
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(Boolean(requestId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig || !requestId) {
      setRide(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getFirestoreDb();
    const ref = doc(db, 'rideRequests', requestId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setRide(null);
          setError('Not found');
        } else {
          setRide(parseRideRequestDoc(snap.id, snap.data() as Record<string, unknown>));
          setError(null);
        }
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [requestId]);

  return { ride, loading, error };
}
