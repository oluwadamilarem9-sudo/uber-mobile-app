import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type Props = {
  visible: boolean;
  mode: 'searching' | 'matched';
};

export function RideSearchingBanner({ visible, mode }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(240)} className="absolute left-3 right-3 top-14 overflow-hidden rounded-2xl">
      <LinearGradient
        colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0.55)']}
        className="px-4 py-3">
        <Text className="text-center text-base font-extrabold text-white">
          {mode === 'searching' ? 'Finding nearby drivers…' : 'Driver matched!'}
        </Text>
        <Text className="mt-1 text-center text-xs text-white/80">
          {mode === 'searching'
            ? 'Hang tight — we are pinging drivers around your pickup.'
            : 'They are heading your way. Watch the map for live movement.'}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}
