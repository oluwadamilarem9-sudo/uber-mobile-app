import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLACEHOLDER_NOTIFICATIONS = [
  {
    id: '1',
    icon: 'car' as const,
    title: 'Trip updates',
    body: 'Live ride status and driver arrival alerts will appear here.',
    time: 'Soon',
  },
  {
    id: '2',
    icon: 'credit-card' as const,
    title: 'Payments',
    body: 'Receipts and fare confirmations for completed trips.',
    time: 'Soon',
  },
  {
    id: '3',
    icon: 'gift' as const,
    title: 'Promotions',
    body: 'OtterRide offers and referral rewards when available.',
    time: 'Soon',
  },
];

export default function ModalScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
        <Text className="text-xl font-bold text-ink">Notifications</Text>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-80">
          <FontAwesome name="close" size={16} color="#6b7280" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
          <Text className="text-sm font-semibold text-ink">
            Push notifications are not enabled in this preview build.
          </Text>
          <Text className="mt-1 text-xs leading-5 text-gray-600">
            Your inbox will list trip, payment, and promo messages once messaging is connected.
          </Text>
        </View>

        {PLACEHOLDER_NOTIFICATIONS.map((n) => (
          <View
            key={n.id}
            className="mb-3 flex-row gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm shadow-black/5">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/20">
              <FontAwesome name={n.icon} size={18} color="#1A1A1A" />
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-ink">{n.title}</Text>
                <Text className="text-xs font-semibold text-gray-400">{n.time}</Text>
              </View>
              <Text className="mt-1 text-sm leading-5 text-gray-600">{n.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
