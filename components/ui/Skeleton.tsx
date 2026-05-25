import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type BoxProps = {
  className?: string;
};

export function SkeletonBox({ className }: BoxProps) {
  return (
    <Animated.View entering={FadeIn.duration(220)} className={`overflow-hidden rounded-2xl ${className ?? ''}`}>
      <LinearGradient
        colors={['#f0f0f0', '#e4e4e4', '#f0f0f0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="h-full w-full"
      />
    </Animated.View>
  );
}

export function RideScreenSkeleton() {
  return (
    <View className="flex-1 bg-surface">
      <SkeletonBox className="h-[46%] w-full rounded-none" />
      <View className="flex-1 rounded-t-3xl bg-white px-5 pt-5 shadow-xl">
        <SkeletonBox className="mx-auto mb-4 h-1.5 w-14 rounded-full" />
        <SkeletonBox className="h-8 w-[72%] max-w-xs" />
        <SkeletonBox className="mt-4 h-24 w-full" />
        <SkeletonBox className="mt-4 h-14 w-full" />
        <SkeletonBox className="mt-3 h-14 w-full" />
      </View>
    </View>
  );
}
