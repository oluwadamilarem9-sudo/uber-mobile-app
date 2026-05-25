import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { hapticSelection } from '@/src/lib/haptics';

const SPRING = { damping: 16, stiffness: 380 };

type Props = Omit<PressableProps, 'children'> & {
  children: ReactNode;
  /** Scale while pressed (default 0.98). */
  pressedScale?: number;
  /** Haptic on press in (default true). */
  hapticOnPressIn?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Subtle press-in scale + optional selection haptic — use on primary CTAs and list rows.
 */
export function PressableScale({
  children,
  pressedScale = 0.98,
  hapticOnPressIn = true,
  contentStyle,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      onPressIn={(e) => {
        if (hapticOnPressIn && !disabled) {
          hapticSelection();
        }
        scale.value = withSpring(pressedScale, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}>
      <Animated.View style={[{ alignSelf: 'stretch' }, contentStyle, anim]}>{children}</Animated.View>
    </Pressable>
  );
}
