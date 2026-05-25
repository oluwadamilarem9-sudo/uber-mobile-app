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
    image:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1080&q=80',
    title: 'Welcome to OtterRide — ride anytime!',
  },
  {
    key: '2',
    image:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1080&q=80',
    title: 'Quick and simple ride booking!',
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
              source={{ uri: slide.image }}
              style={{ flex: 1 }}
              resizeMode="cover">
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
                locations={[0.35, 0.65, 1]}
                style={{ flex: 1 }}>
                <SafeAreaView edges={['top', 'bottom']} className="flex-1">
                  <View className="flex-row justify-end px-5 pt-1">
                    <Pressable
                      onPress={() => void finish()}
                      hitSlop={12}
                      className="rounded-full bg-white/15 px-4 py-2 active:opacity-80">
                      <Text className="text-sm font-bold text-white">Skip</Text>
                    </Pressable>
                  </View>

                  <View className="flex-1 items-center pt-6">
                    <OtterLogo variant="heroOnDark" />
                  </View>

                  <View className="px-6 pb-6">
                    <Text className="max-w-[92%] text-3xl font-extrabold leading-tight text-white">
                      {slide.title}
                    </Text>

                    <View className="mt-8 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        {SLIDES.map((s, i) => (
                          <View
                            key={s.key}
                            className={`h-2 rounded-full ${i === page ? 'w-8 bg-primary' : 'w-2 bg-white/50'}`}
                          />
                        ))}
                      </View>

                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={goPrev}
                          className="h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/30 active:opacity-80">
                          <FontAwesome name="chevron-left" size={16} color="#fff" />
                        </Pressable>
                        <Pressable
                          onPress={() => void goNext()}
                          className="h-12 w-12 items-center justify-center rounded-full bg-white active:opacity-90">
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
