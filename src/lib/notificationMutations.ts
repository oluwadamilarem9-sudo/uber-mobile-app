import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { getFirestoreDb } from '@/src/firebase/firestore';

/** Queues a Firestore `notifications` row; `PushNotificationManager` surfaces it as a local push. */
export async function enqueueRideNotification(input: {
  fromUserId: string;
  toUserId: string;
  rideRequestId: string;
  title: string;
  body: string;
  type: string;
}): Promise<void> {
  const db = getFirestoreDb();
  await addDoc(collection(db, 'notifications'), {
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    title: input.title,
    body: input.body,
    type: input.type,
    rideRequestId: input.rideRequestId,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function createRideAcceptedNotification(input: {
  fromUserId: string;
  toUserId: string;
  driverName: string;
  rideRequestId: string;
}): Promise<void> {
  await enqueueRideNotification({
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    rideRequestId: input.rideRequestId,
    title: 'Driver matched',
    body: `${input.driverName} accepted your ride request.`,
    type: 'ride_accepted',
  });
}
