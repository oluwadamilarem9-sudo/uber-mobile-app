import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { RouteMode } from '@/src/lib/directions';
import { formatDistance, formatDuration } from '@/components/maps/explore/exploreMapFormatters';

const MODES: { id: RouteMode; label: string; icon: ComponentProps<typeof FontAwesome>['name'] }[] = [
  { id: 'driving', label: 'Drive', icon: 'car' },
  { id: 'walking', label: 'Walk', icon: 'male' },
  { id: 'transit', label: 'Transit', icon: 'bus' },
  { id: 'bicycling', label: 'Bike', icon: 'bicycle' },
];

type Props = {
  originLabel: string;
  destinationLabel: string;
  locating: boolean;
  travelMode: RouteMode;
  onChangeMode: (m: RouteMode) => void;
  onPressOrigin: () => void;
  onPressDestination: () => void;
  onSwap: () => void;
  routeMeta: { durationSec: number; distanceMeters: number } | null;
  routing: boolean;
  onClear: () => void;
  children?: ReactNode;
};

export function ExploreRoutePanel({
  originLabel,
  destinationLabel,
  locating,
  travelMode,
  onChangeMode,
  onPressOrigin,
  onPressDestination,
  onSwap,
  routeMeta,
  routing,
  onClear,
  children,
}: Props) {
  return (
    <View style={{ paddingBottom: 20 }}>
      {children}

      <View className="mx-4 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <View className="flex-row">
          <View className="items-center py-4 pl-4">
            <View className="h-3 w-3 rounded-full bg-emerald-500" />
            <View className="my-1 h-8 w-0.5 bg-gray-200" />
            <View className="h-3 w-3 rounded-sm bg-red-500" />
          </View>
          <View className="flex-1 py-2 pr-2">
            <Pressable onPress={onPressOrigin} className="border-b border-gray-100 py-3 active:bg-gray-50">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">From</Text>
              <Text className="mt-0.5 text-base text-ink" numberOfLines={2}>
                {locating ? 'Getting your location…' : originLabel}
              </Text>
            </Pressable>
            <Pressable onPress={onPressDestination} className="py-3 active:bg-gray-50">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">To</Text>
              <Text className="mt-0.5 text-base text-ink" numberOfLines={2}>
                {destinationLabel || 'Search for a destination'}
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={onSwap}
            className="items-center justify-center px-3 active:opacity-60"
            accessibilityLabel="Swap origin and destination">
            <FontAwesome name="exchange" size={18} color="#64748b" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3 px-4"
        contentContainerStyle={{ gap: 8 }}>
        {MODES.map((m) => {
          const active = travelMode === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => onChangeMode(m.id)}
              className={`flex-row items-center rounded-full px-4 py-2.5 ${
                active ? 'bg-ink' : 'border border-gray-200 bg-white'
              }`}>
              <FontAwesome name={m.icon} size={14} color={active ? '#FFD000' : '#64748b'} />
              <Text className={`ml-2 text-sm font-semibold ${active ? 'text-primary' : 'text-gray-700'}`}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {routing ? (
        <View className="mx-4 mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-gray-50 py-4">
          <ActivityIndicator color="#FFD000" />
          <Text className="text-sm font-medium text-gray-600">Finding best route…</Text>
        </View>
      ) : null}

      {routeMeta && !routing ? (
        <View className="mx-4 mt-4 flex-row items-center justify-between rounded-2xl border border-primary/25 bg-primary/10 px-4 py-4">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              {MODES.find((m) => m.id === travelMode)?.label ?? 'Route'}
            </Text>
            <Text className="mt-1 text-2xl font-bold text-ink">{formatDuration(routeMeta.durationSec)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Distance</Text>
            <Text className="mt-1 text-2xl font-bold text-ink">{formatDistance(routeMeta.distanceMeters)}</Text>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onClear}
        className="mx-4 mt-4 items-center rounded-2xl border border-gray-200 py-3 active:bg-gray-50">
        <Text className="text-sm font-semibold text-gray-600">Clear route</Text>
      </Pressable>
    </View>
  );
}
