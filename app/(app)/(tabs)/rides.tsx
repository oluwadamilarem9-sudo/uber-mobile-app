import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { appFonts } from '@/src/theme/fonts';

export default function RidesTabScreen() {
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: tabBarHeight + 28,
        }}>
        <View className="w-full max-w-lg self-center">
          <Text className="text-[28px] font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
            Rides
          </Text>
          <Text className="mt-1 text-[15px] leading-5 text-gray-500" style={{ fontFamily: appFonts.regular }}>
            Request a trip or review where you&apos;ve been.
          </Text>

          <Link href="/(app)/request-ride" asChild>
            <PressableScale className="mt-6">
              <View className="flex-row items-center rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-md shadow-black/8">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/25">
                  <FontAwesome name="plus" size={20} color="#1A1A1A" />
                </View>
                <View className="ml-4 min-w-0 flex-1">
                  <Text className="text-[17px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                    Request a ride
                  </Text>
                  <Text className="mt-0.5 text-[14px] text-gray-500">Pick pickup, drop-off, and vehicle</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
              </View>
            </PressableScale>
          </Link>

          <Link href="/(app)/trip-history" asChild>
            <PressableScale className="mt-3">
              <View className="flex-row items-center rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-md shadow-black/8">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted">
                  <FontAwesome name="history" size={20} color="#1A1A1A" />
                </View>
                <View className="ml-4 min-w-0 flex-1">
                  <Text className="text-[17px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                    Trip history
                  </Text>
                  <Text className="mt-0.5 text-[14px] text-gray-500">Past trips and details</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
              </View>
            </PressableScale>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
