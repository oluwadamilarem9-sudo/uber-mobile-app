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
          Add Firebase keys to `.env` to save your profile in Firestore.
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
        <ActivityIndicator size="large" color="#F5C400" />
      </View>
    );
  }

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F5C400" />
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
      className="flex-1 bg-white">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}>
        {step === 1 ? (
          <>
            <Text className="text-lg font-semibold text-gray-900">Who are you?</Text>
            <Text className="mt-2 text-sm text-gray-600">
              This shows on your profile. You can edit it later.
            </Text>

            <Text className="mt-8 text-sm font-medium text-gray-700">Display name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Alex"
              className="mt-2 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            />

            <Text className="mt-4 text-sm font-medium text-gray-700">Phone (optional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+1 …"
              className="mt-2 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            />

            <Pressable
              disabled={busy}
              onPress={onNextFromStep1}
              className="mt-10 items-center rounded-xl bg-primary py-4 active:opacity-90 disabled:opacity-50">
              <Text className="text-base font-semibold text-gray-900">Next</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-lg font-semibold text-gray-900">How will you use this app?</Text>
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
                className="flex-1 items-center rounded-xl border border-gray-200 bg-secondary py-4 active:opacity-90">
                <Text className="font-semibold text-gray-900">Back</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={onFinish}
                className="flex-1 items-center rounded-xl bg-primary py-4 active:opacity-90 disabled:opacity-50">
                <Text className="font-semibold text-gray-900">{busy ? 'Saving…' : 'Finish'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
