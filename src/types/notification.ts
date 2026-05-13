/** In-app + remote payload types for Firestore `notifications` (Phase 6). */
export type NotificationType = 'ride_accepted' | string;

export type RideNotificationPayload = {
  fromUserId: string;
  toUserId: string;
  title: string;
  body: string;
  type: NotificationType;
  rideRequestId?: string;
  read: boolean;
};
