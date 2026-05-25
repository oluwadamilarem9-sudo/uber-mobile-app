import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

type Props = {
  seconds: number | null;
  label: string;
};

export function EtaChip({ seconds, label }: Props) {
  if (seconds === null) {
    return null;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const text = m > 0 ? `${m}m ${s}s` : `${s}s`;
  return (
    <View className="overflow-hidden rounded-2xl">
      <LinearGradient colors={['#FFCC00', '#f5d547']} className="px-4 py-3">
        <Text className="text-center text-[10px] font-bold uppercase tracking-widest text-ink/70">
          {label}
        </Text>
        <Text className="mt-1 text-center text-2xl font-bold text-ink">{text}</Text>
      </LinearGradient>
    </View>
  );
}
