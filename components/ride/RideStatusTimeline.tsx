import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import type { RideStatus } from '@/src/types/ride';

const STEPS: { label: string; minStatus: RideStatus }[] = [
  { label: 'Searching', minStatus: 'requested' },
  { label: 'Driver found', minStatus: 'accepted' },
  { label: 'Driver arriving', minStatus: 'arriving' },
  { label: 'Trip started', minStatus: 'ongoing' },
  { label: 'Trip completed', minStatus: 'completed' },
  { label: 'Payment complete', minStatus: 'payment_complete' },
];

const ORDER: RideStatus[] = [
  'requested',
  'accepted',
  'arriving',
  'ongoing',
  'completed',
  'payment_complete',
];

function statusRank(s: RideStatus): number {
  if (s === 'cancelled') {
    return -1;
  }
  const i = ORDER.indexOf(s);
  return i === -1 ? 0 : i;
}

type Props = {
  status: RideStatus;
};

export function RideStatusTimeline({ status }: Props) {
  const rank = statusRank(status);
  const cancelled = status === 'cancelled';

  return (
    <View>
      <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">Trip status</Text>
      <View className="mt-4">
        {STEPS.map((step, index) => {
          const stepRank = ORDER.indexOf(step.minStatus);
          const done = !cancelled && rank >= stepRank;
          const current = !cancelled && rank === stepRank;
          const last = index === STEPS.length - 1;
          return (
            <View key={step.label} className="flex-row">
              <View className="mr-3 w-9 items-center">
                <View
                  className={`h-9 w-9 items-center justify-center rounded-full border-2 ${
                    done ? 'border-primary bg-primary' : 'border-gray-200 bg-white'
                  }`}>
                  {done ? (
                    <FontAwesome name="check" size={14} color="#1A1A1A" />
                  ) : (
                    <View className="h-2 w-2 rounded-full bg-gray-300" />
                  )}
                </View>
                {!last ? (
                  <View
                    className={`my-0.5 w-0.5 flex-1 min-h-[14px] ${done ? 'bg-primary/45' : 'bg-gray-200'}`}
                  />
                ) : null}
              </View>
              <View className={`flex-1 ${last ? '' : 'pb-4'}`}>
                <Text
                  className={`text-base font-bold ${current ? 'text-ink' : done ? 'text-ink' : 'text-gray-400'}`}>
                  {step.label}
                </Text>
                {current ? <Text className="mt-0.5 text-xs text-gray-500">Current step</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
      {cancelled ? (
        <Text className="mt-2 text-sm font-semibold text-red-700">This trip was cancelled.</Text>
      ) : null}
    </View>
  );
}
