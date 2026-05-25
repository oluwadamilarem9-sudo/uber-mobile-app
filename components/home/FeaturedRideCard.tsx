import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Image, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import type { FeaturedRide } from '@/src/data/featuredRides';

type Props = {
  ride: FeaturedRide;
  /** Stagger list entrance on home. */
  listIndex?: number;
};

export function FeaturedRideCard({ ride, listIndex = 0 }: Props) {
  const router = useRouter();

  return (
    <Animated.View
      className="mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md shadow-black/6"
      entering={FadeInRight.duration(420).delay(Math.min(listIndex * 70, 420))}>
      <PressableScale pressedScale={0.99} onPress={() => router.push({ pathname: '/(app)/driver/[id]', params: { id: ride.id } })}>
          <View className="flex-row items-start justify-between px-3 pt-3">
            <View className="flex-row items-center gap-3">
              <Image source={{ uri: ride.avatarUrl }} className="h-12 w-12 rounded-full bg-surface-muted" />
              <View>
                <Text className="text-base font-bold text-ink">{ride.driverName}</Text>
                <Text className="mt-0.5 text-xs text-gray-500">{ride.tagline}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="rounded-full bg-surface-muted px-3 py-1">
                <Text className="text-xs font-bold text-ink">{ride.priceLabel}</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
            </View>
          </View>

          <View className="mt-2 px-3">
            <Image
              source={{ uri: ride.imageUrl }}
              className="h-32 w-full rounded-xl bg-surface-muted"
              resizeMode="cover"
            />
          </View>

          <View className="flex-row items-center justify-between px-3 py-3">
            <View>
              <Text className="text-lg font-bold text-ink">{ride.vehicleName}</Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <FontAwesome name="clock-o" size={14} color="#6b7280" />
                <Text className="text-sm text-gray-600">{ride.etaMins}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-semibold text-primary">View</Text>
              <FontAwesome name="angle-right" size={16} color="#1A1A1A" />
            </View>
          </View>
        </PressableScale>
    </Animated.View>
  );
}
