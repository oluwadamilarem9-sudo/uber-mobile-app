import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { getFirestoreDb } from '@/src/firebase/firestore';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { parseRideRequestDoc } from '@/src/lib/parseRideRequestDoc';
import type { RideRequest } from '@/src/types/ride';

/** Realtime list of open requests for driver matching (Phase 4). */
export function useOpenRideRequests() {
  const [items, setItems] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setLoading(false);
      setItems([]);
      return;
    }

    const db = getFirestoreDb();
    const q = query(
      collection(db, 'rideRequests'),
      where('status', '==', 'requested'),
      orderBy('createdAt', 'desc'),
      limit(25),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: RideRequest[] = [];
        snap.forEach((d) => {
          const row = parseRideRequestDoc(d.id, d.data() as Record<string, unknown>);
          if (row && !row.driverId) {
            next.push(row);
          }
        });
        setItems(next);
        setError(null);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  return { items, loading, error };
}
