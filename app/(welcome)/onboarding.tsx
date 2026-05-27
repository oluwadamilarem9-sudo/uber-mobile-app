import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  Text,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtterLogo } from '@/components/otter/OtterLogo';
import { hasWelcomeCompleted, markWelcomeCompleted } from '@/src/lib/welcomeStorage';

const SLIDES = [
  {
    key: '1',
    image: require('@/assets/onboarding/city-night.jpg'),
    title: 'City rides,\npremium feel.',
    subtitle: 'Book in seconds. Arrive in style.',
  },
  {
    key: '2',
    image: require('@/assets/onboarding/car-night.jpg'),
    title: 'Comfort that\nmeets you there.',
    subtitle: 'Smooth pickup. Clean cars. Great drivers.',
  },
  {
    key: '3',
    image: require('@/assets/onboarding/map-ride.jpg'),
    title: 'Search places\nlike Google Maps.',
    subtitle: 'Pick a destination by name and see the best route.',
  },
];

export default function WelcomeOnboardingScreen() {
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void hasWelcomeCompleted().then((done) => {
        if (done) {
          router.replace('/(auth)/login');
        }
      });
    }, [router]),
  );

  const finish = useCallback(async () => {
    await markWelcomeCompleted();
    router.replace('/(auth)/login');
  }, [router]);

  const goNext = useCallback(() => {
    if (page >= SLIDES.length - 1) {
      void finish();
      return;
    }
    pagerRef.current?.setPage(page + 1);
  }, [page, finish]);

  const goPrev = useCallback(() => {
    if (page <= 0) {
      router.replace('/(welcome)/splash');
      return;
    }
    pagerRef.current?.setPage(page - 1);
  }, [page, router]);

  return (
    <View className="flex-1 bg-black">
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}>
        {SLIDES.map((slide) => (
          <View key={slide.key} style={{ flex: 1 }}>
            <ImageBackground
              source={slide.image}
              style={{ flex: 1 }}
              resizeMode="cover">
              <LinearGradient
                colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
                locations={[0, 0.55, 1]}
                style={{ flex: 1 }}>
                <SafeAreaView edges={['top', 'bottom']} className="flex-1">
                  <View className="flex-row justify-end px-5 pt-1">
                    <Pressable
                      onPress={() => void finish()}
                      hitSlop={12}
                      className="rounded-full border border-white/15 bg-black/30 px-4 py-2 active:opacity-80">
                      <Text className="text-sm font-bold text-white/95">Skip</Text>
                    </Pressable>
                  </View>

                  <View className="flex-1 items-center justify-center px-8">
                    <OtterLogo variant="heroOnDark" />
                  </View>

                  <View className="px-6 pb-6">
                    <Text className="max-w-[96%] text-[34px] font-extrabold leading-[38px] tracking-[-0.4px] text-white">
                      {slide.title}
                    </Text>
                    <Text className="mt-3 max-w-[96%] text-base leading-6 text-white/75">
                      {slide.subtitle}
                    </Text>

                    <View className="mt-8 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        {SLIDES.map((s, i) => (
                          <View
                            key={s.key}
                            className={`h-2 rounded-full ${i === page ? 'w-8 bg-primary' : 'w-2 bg-white/35'}`}
                          />
                        ))}
                      </View>

                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={goPrev}
                          className="h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/35 active:opacity-80">
                          <FontAwesome name="chevron-left" size={16} color="rgba(255,255,255,0.92)" />
                        </Pressable>
                        <Pressable
                          onPress={() => void goNext()}
                          className="h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-black/35 active:opacity-90">
                          <FontAwesome name="chevron-right" size={16} color="#111" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </SafeAreaView>
              </LinearGradient>
            </ImageBackground>
          </View>
        ))}
      </PagerView>
    </View>
  );
}
