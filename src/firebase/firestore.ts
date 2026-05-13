import { getFirestore, type Firestore } from 'firebase/firestore';

import { getFirebaseApp, hasFirebaseConfig } from '@/src/firebase/config';

let db: Firestore | undefined;

export function getFirestoreDb(): Firestore {
  if (!hasFirebaseConfig) {
    throw new Error('Firestore requires Firebase env vars in `.env`.');
  }
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}
