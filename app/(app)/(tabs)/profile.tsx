import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { getFirebaseAuth, hasFirebaseConfig } from '@/src/firebase/config';
import { useDriverPresence } from '@/src/hooks/useDriverPresence';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { setDriverOnline } from '@/src/lib/driverPresenceMutations';
import { saveUserProfile } from '@/src/lib/profileMutations';
import type { UserRole } from '@/src/types/profile';
import { useAuthStore } from '@/src/stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid ?? '';

  const { data: profile, isPending } = useUserProfile(uid);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('rider');
  const [mode, setMode] = useState<UserRole>('rider');
  const [busy, setBusy] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);

  const { active: driverActive, loading: driverPresenceLoading } = useDriverPresence(
    role === 'driver' && uid ? uid : undefined,
  );

  useEffect(() => {
    if (!profile) {
      return;
    }
    setDisplayName(profile.displayName);
    setPhone(profile.phone ?? '');
    setRole(profile.role);
    setMode(profile.mode);
  }, [profile]);

  const onToggleDriverOnline = async (next: boolean) => {
    if (!hasFirebaseConfig || !uid) {
      Alert.alert('Firebase', 'Configure `.env` first.');
      return;
    }
    setOnlineBusy(true);
    try {
      await setDriverOnline(uid, next);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not update availability';
      Alert.alert('Error', message);
    } finally {
      setOnlineBusy(false);
    }
  };

  const onSave = async () => {
    if (!hasFirebaseConfig || !uid) {
      Alert.alert('Firebase', 'Configure `.env` to save profile data.');
      return;
    }
    if (!displayName.trim()) {
      Alert.alert('Display name', 'Enter your name.');
      return;
    }
    setBusy(true);
    try {
      await saveUserProfile(uid, {
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        role,
        mode,
      });
      await queryClient.invalidateQueries({ queryKey: ['userProfile', uid] });
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not save';
      Alert.alert('Error', message);
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    if (!hasFirebaseConfig) {
      useAuthStore.getState().setUser(null);
      router.replace('/(auth)/login');
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      useAuthStore.getState().setUser(null);
      router.replace('/(auth)/login');
      return;
    }
    setBusy(true);
    try {
      await signOut(auth);
      queryClient.removeQueries({ queryKey: ['userProfile'] });
      router.replace('/(auth)/login');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign-out failed';
      Alert.alert('Could not sign out', message);
    } finally {
      setBusy(false);
    }
  };

  if (hasFirebaseConfig && isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F5C400" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}>
        <Text className="text-xs font-medium uppercase tracking-wide text-gray-500">Account</Text>
        <Text className="mt-1 text-sm text-gray-600">{user?.email ?? '—'}</Text>

        <Text className="mt-8 text-sm font-medium text-gray-700">Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          className="mt-2 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
        />

        <Text className="mt-4 text-sm font-medium text-gray-700">Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Optional"
          className="mt-2 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
        />

        <Text className="mt-8 text-sm font-semibold text-gray-900">Role</Text>
        <Text className="mt-1 text-xs text-gray-500">Your account type (rider vs driver).</Text>
        <View className="mt-3 flex-row gap-3">
          {(['rider', 'driver'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              className={`flex-1 items-center rounded-xl border-2 py-3 ${
                role === r ? 'border-primary bg-amber-50' : 'border-gray-200 bg-white'
              }`}>
              <Text className="font-semibold capitalize text-gray-900">{r}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="mt-8 text-sm font-semibold text-gray-900">Mode</Text>
        <Text className="mt-1 text-xs text-gray-500">
          Home screen follows this mode (e.g. drivers can switch to rider to request a ride later).
        </Text>
        <View className="mt-3 flex-row gap-3">
          {(['rider', 'driver'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={`flex-1 items-center rounded-xl border-2 py-3 ${
                mode === m ? 'border-primary bg-amber-50' : 'border-gray-200 bg-white'
              }`}>
              <Text className="font-semibold capitalize text-gray-900">{m}</Text>
            </Pressable>
          ))}
        </View>

        {role === 'driver' && hasFirebaseConfig && uid ? (
          <View className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <Text className="text-sm font-semibold text-gray-900">Driver availability</Text>
            <Text className="mt-1 text-xs text-gray-600">
              Go online before you open the request list so you can accept rides.
            </Text>
            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-base font-medium text-gray-800">
                {driverPresenceLoading ? '…' : driverActive ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={driverActive}
                disabled={driverPresenceLoading || onlineBusy}
                onValueChange={(v) => void onToggleDriverOnline(v)}
              />
            </View>
          </View>
        ) : null}

        <Pressable
          disabled={busy}
          onPress={onSave}
          className="mt-10 items-center rounded-xl bg-primary py-4 active:opacity-90 disabled:opacity-50">
          <Text className="font-semibold text-gray-900">{busy ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>

        <Pressable
          disabled={busy}
          onPress={onSignOut}
          className="mt-4 items-center rounded-xl border border-gray-200 bg-secondary py-4 active:opacity-90">
          <Text className="font-semibold text-gray-900">Sign out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
