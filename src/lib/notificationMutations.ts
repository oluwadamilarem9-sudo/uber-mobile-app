import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { getFirestoreDb } from '@/src/firebase/firestore';

/** Queues a notification doc for the recipient (their app shows a local alert via listener). */
export async function createRideAcceptedNotification(input: {
  fromUserId: string;
  toUserId: string;
  driverName: string;
  rideRequestId: string;
}): Promise<void> {
  const db = getFirestoreDb();
  await addDoc(collection(db, 'notifications'), {
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    title: 'Driver matched',
    body: `${input.driverName} accepted your ride request.`,
    type: 'ride_accepted',
    rideRequestId: input.rideRequestId,
    read: false,
    createdAt: serverTimestamp(),
  });
}
