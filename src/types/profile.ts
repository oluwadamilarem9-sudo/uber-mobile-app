export type UserRole = 'rider' | 'driver';

/** Stored under Firestore `users/{uid}`. */
export type UserProfileDoc = {
  displayName: string;
  /** Public HTTPS URL for profile photo (Firebase Storage or CDN). */
  avatarUrl?: string;
  phone?: string;
  /** ISO-style country code (e.g. NG, US). */
  countryCode?: string;
  /** Preferred currency for fares (e.g. USD, NGN). */
  preferredCurrency?: string;
  /** Account type chosen during onboarding (can be updated in Profile). */
  role: UserRole;
  /** Current UI mode (rider home vs driver home). Defaults to `role` when unset. */
  mode: UserRole;
};
