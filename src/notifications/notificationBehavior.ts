import * as Notifications from 'expo-notifications';

let configured = false;

/** Call once on native; controls foreground notification presentation. */
export function ensureNotificationHandlerConfigured() {
  if (configured) {
    return;
  }
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
