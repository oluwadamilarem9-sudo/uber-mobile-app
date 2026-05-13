import { Text, View } from 'react-native';

import type { RideRequest } from '@/src/types/ride';

type Props = {
  ride: RideRequest;
  height: number;
};

export function RideTripMap({ ride, height }: Props) {
  return (
    <View
      style={{ height }}
      className="justify-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
      <Text className="text-center text-sm font-semibold text-gray-800">Trip map (native)</Text>
      <Text className="mt-2 text-center text-xs text-gray-600">
        Pickup {ride.pickup.latitude.toFixed(4)}, {ride.pickup.longitude.toFixed(4)}
      </Text>
      <Text className="mt-1 text-center text-xs text-gray-600">
        Drop {ride.dropoff.latitude.toFixed(4)}, {ride.dropoff.longitude.toFixed(4)}
      </Text>
      {ride.driverLocation ? (
        <Text className="mt-1 text-center text-xs text-gray-600">
          Driver {ride.driverLocation.latitude.toFixed(4)}, {ride.driverLocation.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text className="mt-2 text-center text-xs text-gray-500">Driver position updates on iOS/Android.</Text>
      )}
    </View>
  );
}
