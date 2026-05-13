import {
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { getFirestoreDb } from '@/src/firebase/firestore';
import type { UserProfileDoc, UserRole } from '@/src/types/profile';

export async function saveUserProfile(uid: string, input: UserProfileDoc): Promise<void> {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      displayName: input.displayName.trim(),
      phone: input.phone?.trim() ?? '',
      role: input.role,
      mode: input.mode,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (input.role === 'driver') {
    const driverRef = doc(db, 'drivers', uid);
    await setDoc(
      driverRef,
      {
        userId: uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}

export async function completeOnboarding(
  uid: string,
  displayName: string,
  phone: string | undefined,
  role: UserRole,
): Promise<void> {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  batch.set(
    userRef,
    {
      displayName: displayName.trim(),
      phone: phone?.trim() ?? '',
      role,
      mode: role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (role === 'driver') {
    batch.set(
      doc(db, 'drivers', uid),
      {
        userId: uid,
        active: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
}
