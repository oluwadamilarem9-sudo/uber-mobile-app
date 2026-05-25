import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { getFeaturedRideById } from '@/src/data/featuredRides';
import { appFonts } from '@/src/theme/fonts';

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <View className="flex-row items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <FontAwesome
          key={i}
          name={i < full ? 'star' : 'star-o'}
          size={14}
          color={i < full ? '#FFCC00' : '#d1d5db'}
        />
      ))}
    </View>
  );
}

export default function DriverDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ride = typeof id === 'string' ? getFeaturedRideById(id) : undefined;

  if (!ride) {
    return (
      <>
        <Stack.Screen options={{ title: 'Driver', headerShown: true, headerBackTitle: 'Back' }} />
        <View className="flex-1 items-center justify-center bg-surface px-8">
          <Text className="text-center text-lg font-semibold text-ink">We couldn&apos;t find this driver.</Text>
          <Text className="mt-2 text-center text-sm text-gray-600">Go back and pick another ride.</Text>
        </View>
      </>
    );
  }

  const availabilityLabel =
    ride.availability === 'available'
      ? 'Available now'
      : ride.availability === 'on_trip'
        ? 'On a trip'
        : 'Offline';

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen
        options={{
          title: ride.driverName,
          headerShown: true,
          headerBackTitle: 'Back',
          headerTitleStyle: { fontFamily: appFonts.semibold, fontSize: 17 },
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}>
        <View className="relative h-52 w-full overflow-hidden bg-surface-muted">
          <Image source={{ uri: ride.imageUrl }} className="h-full w-full" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/20" />
        </View>

        <View className="-mt-10 px-4">
          <View className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-black/10">
            <View className="flex-row items-start gap-4">
              <Image source={{ uri: ride.avatarUrl }} className="h-20 w-20 rounded-2xl bg-surface-muted" />
              <View className="min-w-0 flex-1">
                <Text className="text-2xl font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                  {ride.driverName}
                </Text>
                <Text className="mt-1 text-sm text-gray-600">{ride.tagline}</Text>
                <View className="mt-3 flex-row flex-wrap items-center gap-3">
                  <Stars value={ride.rating} />
                  <Text className="text-sm font-semibold text-ink">{ride.rating.toFixed(2)}</Text>
                  <Text className="text-sm text-gray-500">({ride.reviewCount} reviews)</Text>
                </View>
              </View>
            </View>

            <View className="mt-5 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-emerald-50 px-3 py-1.5">
                <Text className="text-xs font-semibold text-emerald-800">{availabilityLabel}</Text>
              </View>
              <View className="rounded-full bg-surface-muted px-3 py-1.5">
                <Text className="text-xs font-semibold text-ink">{ride.priceLabel}</Text>
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-md shadow-black/6">
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">Vehicle</Text>
            <Text className="mt-2 text-lg font-bold text-ink">{ride.vehicleName}</Text>
            <View className="mt-3 gap-2">
              <Text className="text-sm text-gray-700">
                <Text className="font-semibold text-ink">Color: </Text>
                {ride.vehicleColor}
              </Text>
              <Text className="text-sm text-gray-700">
                <Text className="font-semibold text-ink">Plate: </Text>
                {ride.licensePlate}
              </Text>
              <Text className="text-sm text-gray-700">
                <Text className="font-semibold text-ink">Typical ETA: </Text>
                {ride.etaMins}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row gap-3">
            <View className="min-h-[88px] flex-1 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <Text className="text-2xl font-bold text-ink">{ride.completedTrips.toLocaleString()}</Text>
              <Text className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Trips</Text>
            </View>
            <View className="min-h-[88px] flex-1 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <Text className="text-2xl font-bold text-ink">{ride.yearsExperience}+ yrs</Text>
              <Text className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Experience</Text>
            </View>
          </View>

          <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-md shadow-black/6">
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">About</Text>
            <Text className="mt-2 text-sm leading-6 text-gray-700">{ride.about}</Text>
          </View>

          <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-md shadow-black/6">
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">Reviews</Text>
            <View className="mt-3 gap-4">
              {ride.reviews.map((r) => (
                <View key={r.author} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-ink">{r.author}</Text>
                    <Stars value={r.rating} />
                  </View>
                  <Text className="mt-2 text-sm leading-5 text-gray-600">{r.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-6 gap-3">
            <Link href="/(app)/request-ride" asChild>
              <PressableScale className="items-center rounded-2xl bg-primary py-4 shadow-lg shadow-amber-900/20">
                <Text className="text-base font-bold text-ink">Request a ride</Text>
              </PressableScale>
            </Link>
            <PressableScale className="items-center rounded-2xl border border-gray-200 bg-white py-4 shadow-sm">
              <Text className="text-base font-semibold text-gray-500">Message driver (coming soon)</Text>
            </PressableScale>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
