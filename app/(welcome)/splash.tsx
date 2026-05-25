import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtterLogo } from '@/components/otter/OtterLogo';
import { FadeInView } from '@/components/ui/FadeInView';
import { hasWelcomeCompleted, markWelcomeCompleted } from '@/src/lib/welcomeStorage';

export default function WelcomeSplashScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      void hasWelcomeCompleted().then((done) => {
        if (done) {
          router.replace('/(auth)/login');
        }
      });
    }, [router]),
  );

  const skipToAuth = useCallback(async () => {
    await markWelcomeCompleted();
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <View className="flex-1 bg-primary">
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-row justify-end px-5 pt-1">
          <Pressable
            onPress={() => void skipToAuth()}
            hitSlop={12}
            className="rounded-full bg-black/10 px-4 py-2 active:opacity-80">
            <Text className="text-sm font-bold text-ink">Skip</Text>
          </Pressable>
        </View>

        <FadeInView className="flex-1 items-center justify-center px-8">
          <OtterLogo variant="onYellow" />
          <Text className="mt-4 text-center text-base font-medium text-ink/80">
            Modern rides.{'\n'}Yellow lane energy.
          </Text>
        </FadeInView>

        <View className="px-6 pb-4">
          <Pressable
            onPress={() => router.push('/(welcome)/onboarding')}
            className="items-center rounded-3xl bg-ink py-4 shadow-lg shadow-black/25 active:opacity-90">
            <Text className="text-base font-bold text-primary">Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
