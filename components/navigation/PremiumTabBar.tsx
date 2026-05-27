import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { Pressable, Text, View, Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';

import { appFonts } from '@/src/theme/fonts';
import { hapticSelection } from '@/src/lib/haptics';

const ACTIVE = '#FFD000';

const ICONS: Record<string, ComponentProps<typeof FontAwesome>['name']> = {
  index: 'home',
  two: 'map',
  rides: 'car',
  profile: 'user',
};

function TabItem({
  label,
  icon,
  focused,
  onPress,
  onLongPress,
  inactiveColor,
}: {
  label: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  inactiveColor: string;
}) {
  const scale = useSharedValue(focused ? 1.06 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.06 : 1, { damping: 14, stiffness: 220 });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      className="flex-1 items-center justify-center py-1">
      <Animated.View style={animStyle} className="items-center">
        <View
          className={`mb-1 h-9 w-9 items-center justify-center rounded-2xl ${
            focused ? 'bg-primary/25' : ''
          }`}>
          <FontAwesome name={icon} size={focused ? 22 : 20} color={focused ? ACTIVE : inactiveColor} />
        </View>
        <Text
          style={{
            fontFamily: appFonts.semibold,
            fontSize: 10.5,
            fontWeight: '600',
            color: focused ? ACTIVE : inactiveColor,
          }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function PremiumTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const inactive = '#9CA3AF';
  const bottomGap = Math.max(insets.bottom, 10);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: bottomGap,
      }}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderColor: 'rgba(0,0,0,0.07)',
            paddingBottom: Platform.OS === 'ios' ? 6 : 4,
          },
        ]}>
        <View className="flex-row">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? String(options.tabBarLabel)
                : options.title !== undefined
                  ? String(options.title)
                  : route.name;

            const focused = state.index === index;
            const icon = ICONS[route.name] ?? 'circle';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TabItem
                key={route.key}
                label={label}
                icon={icon}
                focused={focused}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                inactiveColor={inactive}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
});
