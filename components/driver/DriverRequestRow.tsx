import React, { memo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { formatMoney } from '@/src/lib/currency';
import type { RideRequest } from '@/src/types/ride';
import { hapticImpactLight } from '@/src/lib/haptics';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

export type DriverRequestRowProps = {
  item: RideRequest;
  acceptDisabled: boolean;
  busyHere: boolean;
  onAccept: (row: RideRequest) => void;
};

function formatRoute(item: RideRequest): string {
  const from =
    item.pickupLabel?.trim() ||
    `${item.pickup.latitude.toFixed(4)}, ${item.pickup.longitude.toFixed(4)}`;
  const to =
    item.dropoffLabel?.trim() ||
    `${item.dropoff.latitude.toFixed(4)}, ${item.dropoff.longitude.toFixed(4)}`;
  return `${from} → ${to}`;
}

function DriverRequestRowInner({ item, acceptDisabled, busyHere, onAccept }: DriverRequestRowProps) {
  const currency = usePreferencesStore((s) => s.currency);
  const fare =
    typeof item.fareEstimateUsd === 'number'
      ? formatMoney(item.fareEstimateUsd, currency)
      : null;

  return (
    <View className="mb-3 rounded-3xl border border-gray-200/90 bg-white px-4 py-4 shadow-md shadow-black/5">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 text-base font-semibold text-ink">{item.riderName}</Text>
        {fare ? (
          <Text className="text-sm font-bold text-ink">{fare}</Text>
        ) : null}
      </View>
      <Text className="mt-1 text-xs text-gray-500" numberOfLines={2}>
        {formatRoute(item)}
      </Text>
      <PressableScale
        onPress={() => {
          hapticImpactLight();
          void onAccept(item);
        }}
        disabled={acceptDisabled}
        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
        className="mt-3 items-center justify-center rounded-3xl bg-primary py-3.5 shadow-md shadow-amber-900/15 disabled:opacity-50"
        hapticOnPressIn={false}>
        {busyHere ? (
          <ActivityIndicator color="#1A1A1A" />
        ) : (
          <Text className="text-sm font-bold text-ink">Accept</Text>
        )}
      </PressableScale>
    </View>
  );
}

export const DriverRequestRow = memo(DriverRequestRowInner);
