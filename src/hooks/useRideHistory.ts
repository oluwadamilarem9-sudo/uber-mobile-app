import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { getFirestoreDb } from '@/src/firebase/firestore';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { parseRideRequestDoc } from '@/src/lib/parseRideRequestDoc';
import type { RideRequest } from '@/src/types/ride';

function sortByCreatedDesc(a: RideRequest, b: RideRequest): number {
  const ta = timestampMs(a.createdAt);
  const tb = timestampMs(b.createdAt);
  return tb - ta;
}

function timestampMs(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (v && typeof v === 'object' && 'seconds' in v) {
    const s = (v as { seconds: number }).seconds;
    return typeof s === 'number' ? s * 1000 : 0;
  }
  return 0;
}

/** Lightweight trip list for the signed-in user (rider + driver roles). */
export function useRideHistory(uid: string | undefined) {
  const [items, setItems] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(Boolean(uid && hasFirebaseConfig));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig || !uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const db = getFirestoreDb();
        const qRider = query(
          collection(db, 'rideRequests'),
          where('riderId', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(20),
        );
        const qDriver = query(
          collection(db, 'rideRequests'),
          where('driverId', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(20),
        );
        const [rSnap, dSnap] = await Promise.all([getDocs(qRider), getDocs(qDriver)]);
        if (cancelled) {
          return;
        }
        const map = new Map<string, RideRequest>();
        rSnap.docs.forEach((d) => {
          const r = parseRideRequestDoc(d.id, d.data() as Record<string, unknown>);
          if (r) {
            map.set(r.id, r);
          }
        });
        dSnap.docs.forEach((d) => {
          const r = parseRideRequestDoc(d.id, d.data() as Record<string, unknown>);
          if (r) {
            map.set(r.id, r);
          }
        });
        const merged = [...map.values()].sort(sortByCreatedDesc);
        setItems(merged);
        setError(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Could not load trips';
        if (!cancelled) {
          setError(msg);
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { items, loading, error };
}
