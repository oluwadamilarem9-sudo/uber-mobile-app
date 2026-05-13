import React, { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { RideRequest } from '@/src/types/ride';

export type DriverRequestRowProps = {
  item: RideRequest;
  acceptDisabled: boolean;
  busyHere: boolean;
  onAccept: (row: RideRequest) => void;
};

function DriverRequestRowInner({ item, acceptDisabled, busyHere, onAccept }: DriverRequestRowProps) {
  return (
    <View className="mb-3 rounded-2xl border border-gray-200/90 bg-white px-4 py-3 shadow-sm">
      <Text className="text-base font-semibold text-gray-900">{item.riderName}</Text>
      <Text className="mt-1 text-xs text-gray-500">
        Pickup {item.pickup.latitude.toFixed(4)}, {item.pickup.longitude.toFixed(4)} → Drop{' '}
        {item.dropoff.latitude.toFixed(4)}, {item.dropoff.longitude.toFixed(4)}
      </Text>
      <Pressable
        onPress={() => void onAccept(item)}
        disabled={acceptDisabled}
        android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
        className="mt-3 items-center justify-center rounded-xl bg-gray-900 py-3 active:opacity-90 disabled:opacity-50">
        {busyHere ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-sm font-semibold text-white">Accept</Text>
        )}
      </Pressable>
    </View>
  );
}

export const DriverRequestRow = memo(DriverRequestRowInner);
