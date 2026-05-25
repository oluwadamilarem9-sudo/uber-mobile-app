/** In-app + remote payload types for Firestore `notifications`. */
export type NotificationType =
  | 'ride_accepted'
  | 'trip_arriving'
  | 'trip_started'
  | 'trip_completed'
  | 'payment_complete'
  | string;

export type RideNotificationPayload = {
  fromUserId: string;
  toUserId: string;
  title: string;
  body: string;
  type: NotificationType;
  rideRequestId?: string;
  read: boolean;
};
