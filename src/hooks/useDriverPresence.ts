import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { hasFirebaseConfig } from '@/src/firebase/config';
import { getFirestoreDb } from '@/src/firebase/firestore';

/** Subscribes to `drivers/{driverId}.active` (Phase 5 online/offline). */
export function useDriverPresence(driverId: string | undefined) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(Boolean(driverId && hasFirebaseConfig));

  useEffect(() => {
    if (!hasFirebaseConfig || !driverId) {
      setActive(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getFirestoreDb();
    const ref = doc(db, 'drivers', driverId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setActive(false);
        } else {
          const v = snap.data()?.active;
          setActive(v === true);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsub();
  }, [driverId]);

  return { active, loading };
}
