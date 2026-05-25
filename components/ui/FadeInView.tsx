import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  /** Stagger list sections (ms). */
  delay?: number;
  className?: string;
};

/** Light entrance animation for screen sections (Phase 5 polish). */
export function FadeInView({ children, delay = 0, className }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(420).delay(delay)} className={className ?? ''}>
      {children}
    </Animated.View>
  );
}
