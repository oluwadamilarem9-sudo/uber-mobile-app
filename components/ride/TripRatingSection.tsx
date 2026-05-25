import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { hapticSelection } from '@/src/lib/haptics';

type Props = {
  title: string;
  subtitle?: string;
  busy: boolean;
  onSubmit: (stars: number, comment: string) => void;
};

export function TripRatingSection({ title, subtitle, busy, onSubmit }: Props) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <View className="mt-6 rounded-2xl border border-gray-100 bg-surface px-4 py-4">
      <Text className="text-sm font-bold text-ink">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-xs leading-5 text-gray-600">{subtitle}</Text>
      ) : null}
      <View className="mt-4 flex-row justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => {
              hapticSelection();
              setStars(n);
            }}
            hitSlop={6}
            className="p-1 active:opacity-70">
            <FontAwesome name={stars >= n ? 'star' : 'star-o'} size={28} color="#FFCC00" />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Optional feedback (max 280 chars)"
        placeholderTextColor="#9ca3af"
        multiline
        maxLength={280}
        className="mt-4 min-h-[72px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink"
      />
      <PressableScale
        disabled={busy || stars < 1}
        onPress={() => onSubmit(stars, comment)}
        className="mt-4 items-center rounded-2xl bg-primary py-3.5 shadow-sm shadow-amber-900/15 disabled:opacity-45"
        hapticOnPressIn={false}>
        {busy ? (
          <ActivityIndicator color="#1A1A1A" />
        ) : (
          <Text className="text-sm font-bold text-ink">Submit rating</Text>
        )}
      </PressableScale>
    </View>
  );
}
