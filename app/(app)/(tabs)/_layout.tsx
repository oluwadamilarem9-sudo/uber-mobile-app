import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PremiumTabBar } from '@/components/navigation/PremiumTabBar';
import { appFonts } from '@/src/theme/fonts';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom, 10);
  const barBody = 58;

  return (
    <Tabs
      detachInactiveScreens
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#FFD000',
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          fontFamily: appFonts.semibold,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: barBody + bottomGap,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="two" options={{ title: 'Explore' }} />
      <Tabs.Screen name="rides" options={{ title: 'Rides' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
