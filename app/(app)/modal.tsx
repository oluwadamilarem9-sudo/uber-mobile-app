import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface px-6">
      <View className="w-full max-w-sm rounded-4xl border border-gray-100 bg-white px-6 py-8 shadow-xl shadow-black/10">
        <Text className="text-center text-xl font-bold text-ink">OtterRide</Text>
        <Text className="mt-3 text-center text-sm leading-5 text-gray-600">
          This route lives under the protected app group, so only signed-in users can open it.
        </Text>
      </View>
      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
    </View>
  );
}
