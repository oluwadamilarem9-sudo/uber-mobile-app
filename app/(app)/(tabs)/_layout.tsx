import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { appFonts } from '@/src/theme/fonts';

const ACTIVE = '#FFCC00';
const INACTIVE_LIGHT = '#9CA3AF';
const INACTIVE_DARK = 'rgba(255,255,255,0.42)';

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  return (
    <FontAwesome
      name={name}
      color={color}
      size={focused ? 23 : 21}
      style={{ marginBottom: Platform.OS === 'ios' ? 1 : 0 }}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const bottomGap = Math.max(insets.bottom, 10);
  const barBody = 54;

  return (
    <Tabs
      detachInactiveScreens
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: isDark ? INACTIVE_DARK : INACTIVE_LIGHT,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          letterSpacing: 0.2,
          fontFamily: appFonts.semibold,
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 0,
          flex: 1,
          justifyContent: 'center',
        },
        tabBarStyle: isDark
          ? {
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: bottomGap,
              height: barBody + bottomGap,
              paddingBottom: bottomGap,
              paddingTop: 4,
              borderRadius: 32,
              backgroundColor: '#121212',
              borderTopWidth: 0,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'rgba(255,255,255,0.1)',
              paddingHorizontal: 4,
              elevation: 22,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.42,
              shadowRadius: 28,
            }
          : {
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: bottomGap,
              height: barBody + bottomGap,
              paddingBottom: bottomGap,
              paddingTop: 4,
              borderRadius: 32,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'rgba(0,0,0,0.07)',
              paddingHorizontal: 4,
              elevation: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.14,
              shadowRadius: 26,
            },
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="map" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Rides',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="car" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="user" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
