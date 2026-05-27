import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtterLogo } from '@/components/otter/OtterLogo';

type Props = {
  children: ReactNode;
};

/**
 * Shared premium auth shell so Login/Signup look identical.
 */
export function AuthScreenShell({ children }: Props) {
  return (
    <View className="flex-1 bg-surface">
      <LinearGradient colors={['#FFD000', '#FFE566', '#FFF8CC']} locations={[0, 0.55, 1]}>
        <SafeAreaView edges={['top']} className="items-center px-6 pb-6 pt-4">
          <OtterLogo variant="onYellow" />
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 rounded-t-[28px] bg-white px-6 pt-2 shadow-lg shadow-black/10">
        {children}
      </View>
      <SafeAreaView edges={['bottom']} className="bg-white" />
    </View>
  );
}
