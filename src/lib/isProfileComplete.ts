import type { UserProfileDoc } from '@/src/types/profile';

export function isUserProfileComplete(
  profile: UserProfileDoc | null | undefined,
): profile is UserProfileDoc {
  return Boolean(
    profile?.displayName?.trim() &&
      profile?.role &&
      (profile.role === 'rider' || profile.role === 'driver'),
  );
}
