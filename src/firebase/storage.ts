import { getStorage, type FirebaseStorage } from 'firebase/storage';

import { getFirebaseApp, hasFirebaseConfig } from '@/src/firebase/config';

let storage: FirebaseStorage | undefined;

/** Firebase Storage singleton. Requires `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` in `.env`. */
export function getFirebaseStorage(): FirebaseStorage | undefined {
  if (!hasFirebaseConfig) {
    return undefined;
  }
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}
