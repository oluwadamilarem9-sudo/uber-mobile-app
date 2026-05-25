import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import type { MockDriverProfile } from '@/src/lib/mockDriverProfile';

type Props = {
  driverName: string;
  profile: MockDriverProfile;
};

export function DriverInfoCard({ driverName, profile }: Props) {
  return (
    <View className="rounded-3xl border border-gray-100 bg-white p-4 shadow-md shadow-black/5">
      <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">Your driver</Text>
      <View className="mt-4 flex-row items-center">
        <Image
          source={{ uri: profile.photoUrl }}
          className="h-16 w-16 rounded-2xl bg-surface-muted"
          style={{ width: 64, height: 64 }}
        />
        <View className="ml-4 flex-1">
          <Text className="text-lg font-bold text-ink">{driverName}</Text>
          <View className="mt-1 flex-row items-center gap-2">
            <FontAwesome name="star" size={14} color="#FFCC00" />
            <Text className="text-sm font-semibold text-ink">
              {profile.rating.toFixed(2)}{' '}
              <Text className="font-normal text-gray-500">({profile.reviewCount} reviews)</Text>
            </Text>
          </View>
          <Text className="mt-1 text-sm text-gray-600">{profile.vehicleModel}</Text>
          <View className="mt-1 self-start rounded-lg bg-surface-muted px-2 py-1">
            <Text className="text-xs font-bold tracking-wide text-ink">{profile.plate}</Text>
          </View>
        </View>
      </View>
      <View className="mt-4 flex-row gap-3">
        <Pressable
          onPress={() => Alert.alert('Call driver', 'Voice calls can plug into Twilio or similar later.')}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-surface py-3 active:opacity-90">
          <FontAwesome name="phone" size={16} color="#1A1A1A" />
          <Text className="text-sm font-bold text-ink">Call</Text>
        </Pressable>
        <Pressable
          onPress={() => Alert.alert('Message driver', 'In-app chat can be added with Firestore threads later.')}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-ink py-3 active:opacity-90">
          <FontAwesome name="comment" size={16} color="#FFCC00" />
          <Text className="text-sm font-bold text-primary">Message</Text>
        </Pressable>
      </View>
    </View>
  );
}
