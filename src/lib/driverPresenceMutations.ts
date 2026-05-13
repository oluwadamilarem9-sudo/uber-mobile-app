import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { getFirestoreDb } from '@/src/firebase/firestore';

/** Marks the signed-in driver as available for matching (Firestore `drivers` doc). */
export async function setDriverOnline(driverId: string, online: boolean): Promise<void> {
  const db = getFirestoreDb();
  const ref = doc(db, 'drivers', driverId);
  await setDoc(
    ref,
    {
      userId: driverId,
      active: online,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
