import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { hasFirebaseConfig } from '@/src/firebase/config';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { useAuthStore } from '@/src/stores/authStore';

function isProfileComplete(
  profile: ReturnType<typeof useUserProfile>['data'],
): profile is NonNullable<typeof profile> {
  return Boolean(
    profile?.displayName?.trim() && profile?.role && (profile.role === 'rider' || profile.role === 'driver'),
  );
}

/**
 * Single entry for post-auth routing: avoids competing Redirects between
 * root index, `(app)/_layout`, and `(auth)/_layout` (which caused update-depth loops).
 */
export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid;

  const { data: profile, isPending: profilePending } = useUserProfile(uid);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F5C400" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (hasFirebaseConfig) {
    if (profilePending) {
      return (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#F5C400" />
        </View>
      );
    }
    if (!isProfileComplete(profile)) {
      return <Redirect href="/(app)/onboarding" />;
    }
  }

  return <Redirect href="/(app)/(tabs)" />;
}
