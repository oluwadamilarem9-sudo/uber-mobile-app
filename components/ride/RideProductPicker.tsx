import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';

import type { RideProduct } from '@/src/lib/rideEstimates';
import { formatMoney } from '@/src/lib/currency';
import { hapticSelection } from '@/src/lib/haptics';

type Props = {
  products: RideProduct[];
  selectedId: RideProduct['id'];
  onSelect: (id: RideProduct['id']) => void;
  estimates: Record<RideProduct['id'], { fareUsd: number; minutes: number }>;
  currencyCode: string;
};

const ICON_MAP: Record<RideProduct['icon'], ComponentProps<typeof FontAwesome>['name']> = {
  automobile: 'automobile',
  users: 'users',
  leaf: 'leaf',
  star: 'star',
  exchange: 'exchange',
};

export function RideProductPicker({
  products,
  selectedId,
  onSelect,
  estimates,
  currencyCode,
}: Props) {
  return (
    <View className="gap-3">
      <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
        Choose a ride
      </Text>
      {products.map((p) => {
        const est = estimates[p.id];
        const active = selectedId === p.id;
        return (
          <Pressable
            key={p.id}
            onPress={() => {
              hapticSelection();
              onSelect(p.id);
            }}
            className="active:opacity-95">
            <Animated.View
              layout={Layout.springify()}
              className={`flex-row items-center rounded-3xl border-2 px-4 py-4 ${
                active
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-100 bg-white'
              } shadow-sm`}>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted">
                <FontAwesome name={ICON_MAP[p.icon]} size={20} color="#1A1A1A" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-ink">{p.name}</Text>
                <Text className="text-xs text-gray-500">{p.description}</Text>
                <Text className="mt-1 text-xs font-semibold text-gray-600">
                  {p.seats} seats · ~{est.minutes} min
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xl font-bold text-ink">
                  {formatMoney(est.fareUsd, currencyCode)}
                </Text>
                <Text className="text-[10px] font-bold uppercase text-gray-400">fixed</Text>
              </View>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}
