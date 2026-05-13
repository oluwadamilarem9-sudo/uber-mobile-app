import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-xl font-bold text-gray-900">Phase 1 modal</Text>
      <Text className="mt-3 text-center text-sm text-gray-600">
        This route lives under the protected `(app)` group, so only signed-in users can open it.
      </Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
