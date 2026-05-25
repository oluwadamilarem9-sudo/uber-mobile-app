import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeaturedRideCard } from '@/components/home/FeaturedRideCard';
import { FadeInView } from '@/components/ui/FadeInView';
import { PressableScale } from '@/components/ui/PressableScale';
import { FEATURED_RIDES } from '@/src/data/featuredRides';
import { hasFirebaseConfig } from '@/src/firebase/config';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { appFonts } from '@/src/theme/fonts';
import { useAuthStore } from '@/src/stores/authStore';

function ServiceChip({
  icon,
  label,
  href,
}: {
  icon: ComponentProps<typeof FontAwesome>['name'];
  label: string;
  href: '/(app)/request-ride' | '/(app)/driver-requests' | '/(app)/(tabs)/two';
}) {
  return (
    <Link href={href} asChild>
      <PressableScale className="min-w-[80px] flex-1">
        <View className="items-center rounded-2xl border border-gray-100 bg-white py-3.5 shadow-sm shadow-black/5">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted">
            <FontAwesome name={icon} size={20} color="#1A1A1A" />
          </View>
          <Text className="mt-2 text-xs font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
            {label}
          </Text>
        </View>
      </PressableScale>
    </Link>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid;
  const { data: profile } = useUserProfile(uid);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const modeLabel = profile?.mode ?? profile?.role ?? 'rider';
  const display = profile?.displayName?.trim() || user?.email?.split('@')[0] || 'Rider';
  const initial = display.charAt(0).toUpperCase();
  const avatarUri = profile?.avatarUrl || user?.photoURL || undefined;

  return (
    <View className="flex-1 bg-surface">
      <View
        className="border-b border-gray-200/80 bg-surface"
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 10,
          paddingHorizontal: 16,
        }}>
        <View className="flex-row items-center">
          <Link href="/(app)/(tabs)/profile" asChild>
            <PressableScale pressedScale={0.94} accessibilityLabel="Open profile">
              {avatarUri ? (
                <Image
                  key={avatarUri}
                  source={{ uri: avatarUri }}
                  className="h-11 w-11 rounded-2xl border border-gray-200/90 bg-white"
                />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-2xl border border-gray-200/90 bg-white shadow-sm shadow-black/5">
                  <Text className="text-base font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                    {initial}
                  </Text>
                </View>
              )}
            </PressableScale>
          </Link>

          <View className="min-w-0 flex-1 px-3">
            <Text
              className="text-center text-[17px] font-semibold text-ink"
              style={{ fontFamily: appFonts.semibold }}
              numberOfLines={1}>
              Hello, {display}
            </Text>
            <Text
              className="mt-0.5 text-center text-[13px] text-gray-500"
              style={{ fontFamily: appFonts.regular }}
              numberOfLines={1}>
              Ready when you are
            </Text>
          </View>

          <Link href="/(app)/modal" asChild>
            <PressableScale pressedScale={0.94} accessibilityLabel="Notifications">
              <View className="h-11 w-11 items-center justify-center rounded-2xl border border-gray-200/90 bg-white shadow-sm shadow-black/5">
                <FontAwesome name="bell-o" size={19} color="#1A1A1A" />
              </View>
            </PressableScale>
          </Link>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: tabBarHeight + 24,
          paddingTop: 14,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-lg self-center">
          <FadeInView delay={0}>
            <Link href="/(app)/(tabs)/two" asChild>
              <PressableScale>
                <View className="flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-md shadow-black/6">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-muted">
                    <FontAwesome name="search" size={18} color="#6b7280" />
                  </View>
                  <Text
                    className="ml-3 flex-1 text-[15px] text-gray-400"
                    style={{ fontFamily: appFonts.medium }}>
                    Search places, routes, and drivers
                  </Text>
                </View>
              </PressableScale>
            </Link>
          </FadeInView>

          <FadeInView delay={60}>
            <Text
              className="mt-6 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500"
              style={{ fontFamily: appFonts.semibold }}>
              Quick actions
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              <Link href="/(app)/request-ride" asChild>
                <PressableScale className="rounded-2xl bg-primary shadow-lg shadow-amber-900/18">
                  <View className="px-4 py-3">
                    <Text className="text-sm font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                      Request a ride
                    </Text>
                  </View>
                </PressableScale>
              </Link>
              <Link href="/(app)/(tabs)/rides" asChild>
                <PressableScale className="rounded-2xl border border-gray-200 bg-white shadow-sm shadow-black/5">
                  <View className="px-4 py-3">
                    <Text className="text-sm font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                      Your rides
                    </Text>
                  </View>
                </PressableScale>
              </Link>
              <Link href="/(app)/(tabs)/two" asChild>
                <PressableScale className="rounded-2xl border border-gray-200 bg-white shadow-sm shadow-black/5">
                  <View className="px-4 py-3">
                    <Text className="text-sm font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                      Explore map
                    </Text>
                  </View>
                </PressableScale>
              </Link>
            </View>
          </FadeInView>

          <FadeInView delay={120}>
            <Text
              className="mt-7 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500"
              style={{ fontFamily: appFonts.semibold }}>
              Services
            </Text>
            <View className="mt-2 flex-row gap-2">
              <ServiceChip icon="automobile" label="Ride" href="/(app)/request-ride" />
              <ServiceChip icon="map" label="Map" href="/(app)/(tabs)/two" />
              <ServiceChip icon="clock-o" label="Drive" href="/(app)/driver-requests" />
            </View>
          </FadeInView>

          <FadeInView delay={180}>
            <Text
              className="mt-7 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500"
              style={{ fontFamily: appFonts.semibold }}>
              Suggested drivers
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-gray-500">
              Highly rated partners nearby — tap a card for details.
            </Text>
            <View className="mt-3">
              {FEATURED_RIDES.map((ride, i) => (
                <FeaturedRideCard key={ride.id} ride={ride} listIndex={i} />
              ))}
            </View>
          </FadeInView>

          <FadeInView delay={240}>
            <View className="mt-6 rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-md shadow-black/6">
              <View className="h-1 w-10 rounded-full bg-primary" />
              <Text
                className="mt-3 text-[11px] font-bold uppercase tracking-wide text-gray-500"
                style={{ fontFamily: appFonts.semibold }}>
                Current mode
              </Text>
              <Text className="mt-1 text-xl font-semibold capitalize text-ink" style={{ fontFamily: appFonts.semibold }}>
                {modeLabel}
              </Text>
              <Text className="mt-2 text-[15px] leading-6 text-gray-600" style={{ fontFamily: appFonts.regular }}>
                {modeLabel === 'rider'
                  ? 'Request a ride and follow your trip in real time.'
                  : 'Go online from Profile, then open requests to accept rides.'}
              </Text>
            </View>
          </FadeInView>

          <FadeInView delay={300}>
            <Text className="mt-7 text-lg font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
              Account
            </Text>
            <Text className="mt-2 text-[15px] leading-6 text-gray-600">
              Signed in as <Text className="font-semibold text-ink">{user?.email ?? '—'}</Text>
            </Text>
            {profile?.displayName ? (
              <Text className="mt-1 text-sm text-gray-600">
                Account type{' '}
                <Text className="font-semibold capitalize text-ink">{profile.role}</Text>
              </Text>
            ) : null}
            {!hasFirebaseConfig ? (
              <Text className="mt-4 text-sm leading-6 text-amber-900/90">
                Cloud sync isn&apos;t enabled in this build. You can still explore the app locally.
              </Text>
            ) : null}
          </FadeInView>

          <FadeInView delay={320}>
            <Link href="/(app)/(tabs)/profile" asChild>
              <Pressable className="mt-4 self-start rounded-xl py-2 active:opacity-80">
                <Text className="text-[15px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                  Profile settings →
                </Text>
              </Pressable>
            </Link>
          </FadeInView>

          {hasFirebaseConfig && uid ? (
            <FadeInView delay={380}>
              <View className="mt-6 gap-3">
                {(profile?.mode ?? profile?.role ?? 'rider') === 'driver' ? (
                  <Link href="/(app)/driver-requests" asChild>
                    <PressableScale className="rounded-2xl bg-primary shadow-lg shadow-amber-900/20">
                      <View className="items-center py-4">
                        <Text className="text-base font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                          Open requests
                        </Text>
                      </View>
                    </PressableScale>
                  </Link>
                ) : (
                  <Link href="/(app)/request-ride" asChild>
                    <PressableScale className="rounded-2xl bg-primary shadow-lg shadow-amber-900/20">
                      <View className="items-center py-4">
                        <Text className="text-base font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                          Request a ride
                        </Text>
                      </View>
                    </PressableScale>
                  </Link>
                )}
                {(profile?.mode ?? profile?.role ?? 'rider') === 'driver' ? (
                  <Link href="/(app)/request-ride" asChild>
                    <PressableScale className="rounded-2xl border-2 border-gray-200 bg-white">
                      <View className="items-center py-4">
                        <Text className="text-base font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                          Request as rider
                        </Text>
                      </View>
                    </PressableScale>
                  </Link>
                ) : (
                  <Link href="/(app)/driver-requests" asChild>
                    <PressableScale className="rounded-2xl border-2 border-gray-200 bg-white">
                      <View className="items-center py-4">
                        <Text className="text-base font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                          Switch to driving
                        </Text>
                      </View>
                    </PressableScale>
                  </Link>
                )}
              </View>
            </FadeInView>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
