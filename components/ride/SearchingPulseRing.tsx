import { View } from 'react-native';

type Props = {
  /** 0–1 pulse width */
  pulse: number;
};

export function SearchingPulseRing({ pulse }: Props) {
  const scale = 1 + pulse * 0.35;
  const opacity = 0.55 - pulse * 0.45;
  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 top-24 items-center justify-center"
      style={{ height: 200 }}>
      <View
        className="h-28 w-28 rounded-full border-4 border-primary"
        style={{ transform: [{ scale }], opacity }}
      />
    </View>
  );
}
