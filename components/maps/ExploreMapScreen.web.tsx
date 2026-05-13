import { Text, View } from 'react-native';

/**
 * Web bundle cannot load `react-native-maps` (native-only). This file is picked automatically
 * by Metro for `import '@/components/maps/ExploreMapScreen'` on web.
 */
export function ExploreMapScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-center text-lg font-semibold text-gray-900">Maps on web</Text>
      <Text className="mt-3 text-center text-sm text-gray-600">
        The Explore map uses react-native-maps, which only runs on iOS and Android. Open this project in
        Expo Go on a phone or use an emulator to use the map, GPS, and route line.
      </Text>
    </View>
  );
}
