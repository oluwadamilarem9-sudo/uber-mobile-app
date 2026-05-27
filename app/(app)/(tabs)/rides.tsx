import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { FadeInView } from '@/components/ui/FadeInView';
import { RIDE_PRODUCTS } from '@/src/lib/rideEstimates';
import { formatMoney } from '@/src/lib/currency';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { appFonts } from '@/src/theme/fonts';

function RideTypePreview() {
  const currency = usePreferencesStore((s) => s.currency);
  return (
    <View className="mt-4 gap-2">
      {RIDE_PRODUCTS.slice(0, 4).map((p) => (
        <View
          key={p.id}
          className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-surface-muted/80 px-3 py-2.5">
          <Text className="text-sm font-semibold text-ink">{p.name}</Text>
          <Text className="text-sm font-bold text-ink">{formatMoney(p.fareUsd, currency)}</Text>
        </View>
      ))}
      <Text className="text-center text-xs text-gray-500">+2 more options at checkout</Text>
    </View>
  );
}

export default function RidesTabScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const currency = usePreferencesStore((s) => s.currency);

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
          <FadeInView>
            <Text className="text-[28px] font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
              Rides
            </Text>
            <Text className="mt-1 text-[15px] leading-5 text-gray-500" style={{ fontFamily: appFonts.regular }}>
              Book a trip in seconds. Fixed fares up to {formatMoney(9.99, currency)}.
            </Text>
          </FadeInView>

          <FadeInView delay={80}>
            <Link href="/(app)/request-ride" asChild>
              <PressableScale className="mt-6">
                <View className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg shadow-black/10">
                  <View className="bg-primary/20 px-4 py-3">
                    <Text className="text-xs font-bold uppercase tracking-widest text-ink/70">Ready to go</Text>
                  </View>
                  <View className="flex-row items-center px-4 py-4">
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
                      <FontAwesome name="map-marker" size={22} color="#1A1A1A" />
                    </View>
                    <View className="ml-4 min-w-0 flex-1">
                      <Text className="text-[18px] font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                        Request a ride
                      </Text>
                      <Text className="mt-0.5 text-[14px] text-gray-500">
                        Search pickup & destination by name
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                  </View>
                  <View className="border-t border-gray-100 px-4 py-3">
                    <RideTypePreview />
                  </View>
                </View>
              </PressableScale>
            </Link>
          </FadeInView>

          <FadeInView delay={140}>
            <Link href="/(app)/(tabs)/two" asChild>
              <PressableScale className="mt-3">
                <View className="flex-row items-center rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-md shadow-black/8">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted">
                    <FontAwesome name="map" size={20} color="#1A1A1A" />
                  </View>
                  <View className="ml-4 min-w-0 flex-1">
                    <Text className="text-[17px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                      Explore map
                    </Text>
                    <Text className="mt-0.5 text-[14px] text-gray-500">
                      Routes, traffic & place search
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                </View>
              </PressableScale>
            </Link>
          </FadeInView>

          <FadeInView delay={200}>
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
                    <Text className="mt-0.5 text-[14px] text-gray-500">Past trips and receipts</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                </View>
              </PressableScale>
            </Link>
          </FadeInView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
