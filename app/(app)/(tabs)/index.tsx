import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInView } from '@/components/ui/FadeInView';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { useAuthStore } from '@/src/stores/authStore';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid;
  const { data: profile } = useUserProfile(uid);

  const modeLabel = profile?.mode ?? profile?.role ?? 'rider';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <View className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 shadow-sm">
            <View className="h-1 w-10 rounded-full bg-primary" />
            <Text className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
              Current mode
            </Text>
            <Text className="mt-1 text-xl font-bold capitalize text-gray-900">{modeLabel}</Text>
            <Text className="mt-2 text-sm leading-5 text-amber-900/80">
              {modeLabel === 'rider'
                ? 'Request a ride and track status in real time.'
                : 'Browse open requests and accept one to match.'}
            </Text>
          </View>
        </FadeInView>

        <FadeInView delay={70}>
          <Text className="mt-8 text-2xl font-bold text-gray-900">Home</Text>
          <Text className="mt-2 text-base leading-6 text-gray-600">
            Signed in as <Text className="font-semibold text-gray-900">{user?.email ?? '—'}</Text>
          </Text>
          {profile?.displayName ? (
            <Text className="mt-2 text-base leading-6 text-gray-600">
              Profile:{' '}
              <Text className="font-semibold text-gray-900">{profile.displayName}</Text>
              {' · '}
              <Text className="capitalize">{profile.role}</Text>
            </Text>
          ) : null}

          {!hasFirebaseConfig ? (
            <Text className="mt-6 text-sm leading-5 text-amber-800">
              Add Firebase keys to `.env` for Firestore profile and onboarding.
            </Text>
          ) : null}
        </FadeInView>

        <FadeInView delay={140}>
          <Link href="/(app)/(tabs)/profile" asChild>
            <Pressable
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              className="mt-8 self-start rounded-lg px-1 py-2 active:opacity-70">
              <Text className="text-base font-semibold text-gray-900 underline">Edit profile & mode →</Text>
            </Pressable>
          </Link>
        </FadeInView>

        {hasFirebaseConfig && uid ? (
          <FadeInView delay={210}>
            <View className="mt-6 gap-3">
              {(profile?.mode ?? profile?.role ?? 'rider') === 'driver' ? (
                <Link href="/(app)/driver-requests" asChild>
                  <Pressable
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                    className="rounded-2xl bg-gray-900 px-5 py-4 shadow-md shadow-gray-900/25 active:opacity-95">
                    <Text className="text-center text-base font-semibold text-white">Open requests</Text>
                  </Pressable>
                </Link>
              ) : (
                <Link href="/(app)/request-ride" asChild>
                  <Pressable
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                    className="rounded-2xl bg-gray-900 px-5 py-4 shadow-md shadow-gray-900/25 active:opacity-95">
                    <Text className="text-center text-base font-semibold text-white">Request a ride</Text>
                  </Pressable>
                </Link>
              )}
              {(profile?.mode ?? profile?.role ?? 'rider') === 'driver' ? (
                <Link href="/(app)/request-ride" asChild>
                  <Pressable
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm active:opacity-90">
                    <Text className="text-center text-base font-semibold text-gray-900">
                      Request as rider (same account)
                    </Text>
                  </Pressable>
                </Link>
              ) : (
                <Link href="/(app)/driver-requests" asChild>
                  <Pressable
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm active:opacity-90">
                    <Text className="text-center text-base font-semibold text-gray-900">
                      Driver: open requests
                    </Text>
                  </Pressable>
                </Link>
              )}
            </View>
          </FadeInView>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
