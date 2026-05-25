import { Text, View } from 'react-native';

/**
 * Web bundle cannot load `react-native-maps` (native-only). This file is picked automatically
 * by Metro for `import '@/components/maps/ExploreMapScreen'` on web.
 */
export function ExploreMapScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface px-8 py-12">
      <Text className="text-center text-xl font-extrabold text-ink">Maps on web</Text>
      <Text className="mt-4 text-center text-sm leading-6 text-gray-600">
        The Explore map uses Google Maps data on iOS and Android: place search by name, driving/walking/transit/bike
        routes, traffic, satellite layers, and a Google Maps–style search UI. Open OtterRide on a device or emulator
        to try it.
      </Text>
    </View>
  );
}
