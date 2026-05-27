import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseAuth } from '@/src/firebase/config';
import { getFirestoreDb } from '@/src/firebase/firestore';
import { deleteProfileAvatarObject } from '@/src/lib/profileAvatarUpload';
import type { UserProfileDoc, UserRole } from '@/src/types/profile';

export async function saveUserProfile(uid: string, input: UserProfileDoc): Promise<void> {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', uid);
  const avatar =
    input.avatarUrl === undefined
      ? undefined
      : input.avatarUrl === ''
        ? null
        : input.avatarUrl.trim();

  await setDoc(
    ref,
    {
      displayName: input.displayName.trim(),
      ...(avatar !== undefined ? { avatarUrl: avatar } : {}),
      phone: input.phone?.trim() ?? '',
      ...(input.countryCode ? { countryCode: input.countryCode } : {}),
      ...(input.preferredCurrency ? { preferredCurrency: input.preferredCurrency } : {}),
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

export async function syncAuthProfileBasics(user: User, displayName: string, photoURL?: string | null): Promise<void> {
  await updateProfile(user, {
    displayName: displayName.trim(),
    ...(photoURL === undefined ? {} : { photoURL: photoURL ?? null }),
  });
}

export async function updateAccountEmail(newEmail: string, currentPassword: string): Promise<void> {
  const auth = getFirebaseAuth();
  const u = auth?.currentUser;
  if (!u?.email) {
    throw new Error('Not signed in.');
  }
  const cred = EmailAuthProvider.credential(u.email, currentPassword);
  await reauthenticateWithCredential(u, cred);
  await updateEmail(u, newEmail.trim());
}

export async function deleteAccountPermanent(currentPassword: string): Promise<void> {
  const auth = getFirebaseAuth();
  const u = auth?.currentUser;
  const uid = u?.uid;
  if (!u?.email || !uid) {
    throw new Error('Not signed in.');
  }
  const cred = EmailAuthProvider.credential(u.email, currentPassword);
  await reauthenticateWithCredential(u, cred);
  const db = getFirestoreDb();
  await deleteDoc(doc(db, 'users', uid));
  try {
    await deleteDoc(doc(db, 'drivers', uid));
  } catch {
    // Driver doc may not exist.
  }
  await deleteProfileAvatarObject(uid);
  await deleteUser(u);
}
