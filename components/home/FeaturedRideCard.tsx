import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import type { FeaturedRide } from '@/src/data/featuredRides';
import { getDriverAvatar, getDriverBanner } from '@/src/data/driverAssets';
import { appFonts } from '@/src/theme/fonts';

type Props = {
  ride: FeaturedRide;
  listIndex?: number;
};

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View className="flex-row items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <FontAwesome
            key={i}
            name={filled ? 'star' : 'star-o'}
            size={11}
            color={filled ? '#FFD000' : '#d1d5db'}
          />
        );
      })}
      <Text className="ml-1.5 text-xs font-semibold text-gray-600" style={{ fontFamily: appFonts.semibold }}>
        {rating.toFixed(2)}
      </Text>
    </View>
  );
}

export function FeaturedRideCard({ ride, listIndex = 0 }: Props) {
  const router = useRouter();
  const banner = getDriverBanner(ride.id);
  const avatar = getDriverAvatar(ride.id);

  return (
    <Animated.View
      className="mb-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg shadow-black/8"
      entering={FadeInRight.duration(420).delay(Math.min(listIndex * 70, 420))}>
      <PressableScale
        pressedScale={0.985}
        onPress={() => router.push({ pathname: '/(app)/driver/[id]', params: { id: ride.id } })}>
        <View className="relative h-36 w-full overflow-hidden bg-surface-muted">
          <Image source={banner} className="absolute inset-0 h-full w-full" resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            className="absolute inset-0"
          />
          <View className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1.5 shadow-sm">
            <Text className="text-xs font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
              {ride.priceLabel}
            </Text>
          </View>
          <View className="absolute bottom-0 left-0 right-0 flex-row items-end px-4 pb-3">
            <View className="h-[52px] w-[52px] overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md">
              <Image source={avatar} className="h-full w-full" resizeMode="cover" />
            </View>
            <View className="ml-3 min-w-0 flex-1 pb-0.5">
              <Text
                className="text-lg font-bold text-white"
                style={{ fontFamily: appFonts.bold }}
                numberOfLines={1}>
                {ride.driverName}
              </Text>
              <Text className="mt-0.5 text-xs text-white/90" numberOfLines={1}>
                {ride.tagline}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 pb-4 pt-3">
          <View className="flex-row items-center justify-between">
            <RatingStars rating={ride.rating} />
            <Text className="text-xs text-gray-500">{ride.reviewCount} reviews</Text>
          </View>

          <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-surface-muted px-3 py-2.5">
            <View className="min-w-0 flex-1 pr-2">
              <Text className="text-base font-bold text-ink" style={{ fontFamily: appFonts.bold }} numberOfLines={1}>
                {ride.vehicleName}
              </Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <FontAwesome name="clock-o" size={13} color="#6b7280" />
                <Text className="text-sm text-gray-600">{ride.etaMins} away</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1 rounded-full bg-white px-3 py-2 shadow-sm">
              <Text className="text-sm font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                View profile
              </Text>
              <FontAwesome name="angle-right" size={16} color="#1A1A1A" />
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}
