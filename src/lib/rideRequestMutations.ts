import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { getFirestoreDb } from '@/src/firebase/firestore';
import type { RideProductId } from '@/src/lib/rideEstimates';
import type { GeoPoint, RideRequest, RideStatus } from '@/src/types/ride';

export async function createRideRequest(input: {
  riderId: string;
  riderName: string;
  pickup: GeoPoint;
  dropoff: GeoPoint;
  pickupLabel?: string;
  dropoffLabel?: string;
  rideProductId?: RideProductId;
  fareEstimateUsd?: number;
  etaMinutesGuess?: number;
}): Promise<string> {
  const db = getFirestoreDb();
  const payload: Record<string, unknown> = {
    riderId: input.riderId,
    riderName: input.riderName,
    pickup: input.pickup,
    dropoff: input.dropoff,
    ...(input.pickupLabel?.trim() ? { pickupLabel: input.pickupLabel.trim() } : {}),
    ...(input.dropoffLabel?.trim() ? { dropoffLabel: input.dropoffLabel.trim() } : {}),
    status: 'requested' satisfies RideStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.rideProductId) {
    payload.rideProductId = input.rideProductId;
  }
  if (typeof input.fareEstimateUsd === 'number' && Number.isFinite(input.fareEstimateUsd)) {
    payload.fareEstimateUsd = input.fareEstimateUsd;
  }
  if (typeof input.etaMinutesGuess === 'number' && Number.isFinite(input.etaMinutesGuess)) {
    payload.etaMinutesGuess = input.etaMinutesGuess;
  }
  const ref = await addDoc(collection(db, 'rideRequests'), payload);
  return ref.id;
}

/**
 * First driver to win the transaction gets the request (simple matching for Phase 4).
 */
export async function acceptRideRequest(requestId: string, driverId: string, driverName: string) {
  const db = getFirestoreDb();
  const ref = doc(db, 'rideRequests', requestId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Ride request no longer exists.');
    }
    const data = snap.data() as RideRequest;
    if (data.status !== 'requested') {
      throw new Error('This request is no longer open.');
    }
    if (data.driverId) {
      throw new Error('Another driver already accepted.');
    }

    transaction.update(ref, {
      driverId,
      driverName,
      status: 'accepted' satisfies RideStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function cancelRideRequest(requestId: string, riderId: string) {
  const db = getFirestoreDb();
  const ref = doc(db, 'rideRequests', requestId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Ride request not found.');
    }
    const data = snap.data() as RideRequest;
    if (data.riderId !== riderId) {
      throw new Error('Not your ride request.');
    }
    if (
      data.status === 'completed' ||
      data.status === 'payment_complete' ||
      data.status === 'cancelled' ||
      data.status === 'ongoing'
    ) {
      throw new Error('Cannot cancel in this state.');
    }
    transaction.update(ref, {
      status: 'cancelled' satisfies RideStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

const DRIVER_ADVANCE: Partial<Record<RideStatus, RideStatus>> = {
  accepted: 'arriving',
  arriving: 'ongoing',
  ongoing: 'completed',
};

function nextTripStatusOrThrow(current: RideStatus, next: RideStatus) {
  if (DRIVER_ADVANCE[current] !== next) {
    throw new Error('Invalid trip status transition.');
  }
}

/** Driver advances trip: accepted → arriving → ongoing → completed. */
export async function advanceRideTripStatus(
  requestId: string,
  driverId: string,
  nextStatus: Extract<RideStatus, 'arriving' | 'ongoing' | 'completed'>,
) {
  const db = getFirestoreDb();
  const ref = doc(db, 'rideRequests', requestId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Ride request not found.');
    }
    const data = snap.data() as RideRequest;
    if (data.driverId !== driverId) {
      throw new Error('Not assigned to this trip.');
    }
    nextTripStatusOrThrow(data.status, nextStatus);
    transaction.update(ref, {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

/** Broadcast driver GPS to the shared ride document (rider sees it in realtime). */
export async function updateRideDriverLocation(
  requestId: string,
  driverId: string,
  location: GeoPoint,
) {
  const db = getFirestoreDb();
  const ref = doc(db, 'rideRequests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return;
  }
  const data = snap.data() as RideRequest;
  if (data.driverId !== driverId) {
    return;
  }
  if (
    data.status !== 'accepted' &&
    data.status !== 'arriving' &&
    data.status !== 'ongoing'
  ) {
    return;
  }
  await updateDoc(ref, {
    driverLocation: location,
    updatedAt: serverTimestamp(),
  });
}

/** Rider marks trip paid / settled after driver completed the trip (Uber-style final step). */
export async function markRidePaymentComplete(requestId: string, riderId: string) {
  const db = getFirestoreDb();
  const ref = doc(db, 'rideRequests', requestId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Ride request not found.');
    }
    const data = snap.data() as RideRequest;
    if (data.riderId !== riderId) {
      throw new Error('Only the rider can confirm payment.');
    }
    if (data.status !== 'completed') {
      throw new Error('Trip must be completed before payment can be confirmed.');
    }
    transaction.update(ref, {
      status: 'payment_complete' satisfies RideStatus,
      updatedAt: serverTimestamp(),
      /** No external PSP — marks doc for rules + UI. */
      paymentSimulated: true,
    });
  });
}

const MAX_RATING_COMMENT = 280;

/** Rider rates driver once, after `payment_complete`. */
export async function submitRiderRatesDriver(
  requestId: string,
  riderId: string,
  stars: number,
  comment?: string,
) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new Error('Pick a rating from 1 to 5.');
  }
  const trimmed = comment?.trim() ?? '';
  if (trimmed.length > MAX_RATING_COMMENT) {
    throw new Error('Comment is too long.');
  }

  const db = getFirestoreDb();
  const ref = doc(db, 'rideRequests', requestId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Ride request not found.');
    }
    const data = snap.data() as RideRequest;
    if (data.riderId !== riderId) {
      throw new Error('Only the rider can submit this rating.');
    }
    if (data.status !== 'payment_complete') {
      throw new Error('You can rate after the trip is fully settled.');
    }
    if (typeof data.riderRatingDriver === 'number') {
      throw new Error('You already rated this trip.');
    }
    const payload: Record<string, unknown> = {
      riderRatingDriver: stars,
      updatedAt: serverTimestamp(),
    };
    if (trimmed.length > 0) {
      payload.riderRatingComment = trimmed;
    }
    transaction.update(ref, payload);
  });
}

/** Driver rates rider once, after `payment_complete`. */
export async function submitDriverRatesRider(
  requestId: string,
  driverId: string,
  stars: number,
  comment?: string,
) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new Error('Pick a rating from 1 to 5.');
  }
  const trimmed = comment?.trim() ?? '';
  if (trimmed.length > MAX_RATING_COMMENT) {
    throw new Error('Comment is too long.');
  }

  const db = getFirestoreDb();
  const ref = doc(db, 'rideRequests', requestId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error('Ride request not found.');
    }
    const data = snap.data() as RideRequest;
    if (data.driverId !== driverId) {
      throw new Error('Only the assigned driver can submit this rating.');
    }
    if (data.status !== 'payment_complete') {
      throw new Error('You can rate after the trip is fully settled.');
    }
    if (typeof data.driverRatingRider === 'number') {
      throw new Error('You already rated this trip.');
    }
    const payload: Record<string, unknown> = {
      driverRatingRider: stars,
      updatedAt: serverTimestamp(),
    };
    if (trimmed.length > 0) {
      payload.driverRatingComment = trimmed;
    }
    transaction.update(ref, payload);
  });
}
