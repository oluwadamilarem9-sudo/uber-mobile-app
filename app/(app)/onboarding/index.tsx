import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { hasFirebaseConfig } from '@/src/firebase/config';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { completeOnboarding } from '@/src/lib/profileMutations';
import type { UserRole } from '@/src/types/profile';
import { useAuthStore } from '@/src/stores/authStore';

function profileLooksComplete(
  p: ReturnType<typeof useUserProfile>['data'],
): p is NonNullable<typeof p> {
  return Boolean(p?.role && p.displayName?.trim());
}

export default function OnboardingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid;
  const { data: profile, isPending } = useUserProfile(uid);

  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [busy, setBusy] = useState(false);

  const sentToTabsRef = useRef(false);

  useEffect(() => {
    if (!hasFirebaseConfig || !uid) {
      return;
    }
    if (isPending) {
      return;
    }
    if (!profileLooksComplete(profile)) {
      return;
    }
    if (sentToTabsRef.current) {
      return;
    }
    sentToTabsRef.current = true;
    router.replace('/(app)/(tabs)');
  }, [uid, isPending, profile, router]);

  if (!hasFirebaseConfig) {
    return (
      <View className="flex-1 justify-center bg-white px-6">
        <Text className="text-center text-base text-gray-700">
          Connect this app to OtterRide cloud to save your profile and continue.
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          className="mt-6 items-center rounded-xl bg-primary py-4">
          <Text className="font-semibold text-gray-900">Continue without cloud profile</Text>
        </Pressable>
      </View>
    );
  }

  if (!uid) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isPending && profileLooksComplete(profile)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FFCC00" />
      </View>
    );
  }

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FFCC00" />
      </View>
    );
  }

  const onNextFromStep1 = () => {
    if (!displayName.trim()) {
      Alert.alert('Name required', 'Enter the name riders or drivers will see.');
      return;
    }
    setStep(2);
  };

  const onFinish = async () => {
    if (!role) {
      Alert.alert('Choose a role', 'Pick Rider or Driver to continue.');
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding(uid, displayName, phone.trim() || undefined, role);
      await queryClient.invalidateQueries({ queryKey: ['userProfile', uid] });
      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not save profile';
      Alert.alert('Error', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}>
        {step === 1 ? (
          <>
            <Text className="text-2xl font-bold text-ink">Who are you?</Text>
            <Text className="mt-2 text-sm text-gray-600">
              This shows on your profile. You can edit it later.
            </Text>

            <Text className="mt-8 text-sm font-medium text-gray-700">Display name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Alex"
              placeholderTextColor="#9ca3af"
              className="mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base text-ink shadow-sm"
            />

            <Text className="mt-4 text-sm font-medium text-gray-700">Phone (optional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+1 …"
              placeholderTextColor="#9ca3af"
              className="mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base text-ink shadow-sm"
            />

            <Pressable
              disabled={busy}
              onPress={onNextFromStep1}
              className="mt-10 items-center rounded-3xl bg-primary py-4 shadow-md shadow-amber-900/15 active:opacity-95 disabled:opacity-50">
              <Text className="text-base font-bold text-ink">Next</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-2xl font-bold text-ink">How will you use OtterRide?</Text>
            <Text className="mt-2 text-sm text-gray-600">
              You can change this later in Profile. Phase 3+ adds maps and rides.
            </Text>

            <View className="mt-8 gap-4">
              <Pressable
                onPress={() => setRole('rider')}
                className={`rounded-2xl border-2 px-4 py-5 ${
                  role === 'rider' ? 'border-primary bg-amber-50' : 'border-gray-200 bg-white'
                }`}>
                <Text className="text-lg font-semibold text-gray-900">Rider</Text>
                <Text className="mt-1 text-sm text-gray-600">Book trips and see fare estimates.</Text>
              </Pressable>

              <Pressable
                onPress={() => setRole('driver')}
                className={`rounded-2xl border-2 px-4 py-5 ${
                  role === 'driver' ? 'border-primary bg-amber-50' : 'border-gray-200 bg-white'
                }`}>
                <Text className="text-lg font-semibold text-gray-900">Driver</Text>
                <Text className="mt-1 text-sm text-gray-600">
                  Accept requests and earn on trips (coming in later phases).
                </Text>
              </Pressable>
            </View>

            <View className="mt-10 flex-row gap-3">
              <Pressable
                disabled={busy}
                onPress={() => setStep(1)}
                className="flex-1 items-center rounded-3xl border-2 border-gray-200 bg-white py-4 active:opacity-90">
                <Text className="font-bold text-ink">Back</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={onFinish}
                className="flex-1 items-center rounded-3xl bg-primary py-4 shadow-md shadow-amber-900/15 active:opacity-95 disabled:opacity-50">
                <Text className="font-bold text-ink">{busy ? 'Saving…' : 'Finish'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
