import FontAwesome from '@expo/vector-icons/FontAwesome';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { getFirebaseAuth, hasFirebaseConfig } from '@/src/firebase/config';
import { useDriverPresence } from '@/src/hooks/useDriverPresence';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { setDriverOnline } from '@/src/lib/driverPresenceMutations';
import { deleteProfileAvatarObject, uploadProfileAvatarFromUri } from '@/src/lib/profileAvatarUpload';
import {
  deleteAccountPermanent,
  saveUserProfile,
  syncAuthProfileBasics,
  updateAccountEmail,
} from '@/src/lib/profileMutations';
import { appFonts } from '@/src/theme/fonts';
import type { UserRole } from '@/src/types/profile';
import { useAuthStore } from '@/src/stores/authStore';

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  danger,
}: {
  icon: ComponentProps<typeof FontAwesome>['name'];
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <PressableScale onPress={onPress} className="border-b border-gray-100 last:border-b-0">
      <View className="flex-row items-center gap-3 py-3.5">
        <View
          className={`h-10 w-10 items-center justify-center rounded-xl ${danger ? 'bg-red-50' : 'bg-surface-muted'}`}>
          <FontAwesome name={icon} size={18} color={danger ? '#b91c1c' : '#1A1A1A'} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className={`text-[16px] font-semibold ${danger ? 'text-red-700' : 'text-ink'}`}
            style={{ fontFamily: appFonts.semibold }}>
            {label}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[13px] text-gray-500" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
      </View>
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid ?? '';

  const { data: profile, isPending } = useUserProfile(uid);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('rider');
  const [mode, setMode] = useState<UserRole>('rider');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const { active: driverActive, loading: driverPresenceLoading } = useDriverPresence(
    role === 'driver' && uid ? uid : undefined,
  );

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setPhone(profile.phone ?? '');
      setRole(profile.role);
      setMode(profile.mode);
      setAvatarUrl(profile.avatarUrl ?? user?.photoURL ?? undefined);
    } else {
      setAvatarUrl(user?.photoURL ?? undefined);
    }
  }, [profile, user?.photoURL]);

  const display = displayName.trim() || user?.email?.split('@')[0] || 'You';
  const initial = display.charAt(0).toUpperCase();
  const resolvedPhoto = avatarUrl ?? user?.photoURL ?? null;

  const onToggleDriverOnline = async (next: boolean) => {
    if (!hasFirebaseConfig || !uid) {
      Alert.alert('Not available', 'Connect your account to change availability.');
      return;
    }
    setOnlineBusy(true);
    try {
      await setDriverOnline(uid, next);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not update availability';
      Alert.alert('Something went wrong', message);
    } finally {
      setOnlineBusy(false);
    }
  };

  const onSave = async () => {
    if (!hasFirebaseConfig || !uid) {
      Alert.alert('Not available', 'Connect your account to save profile changes.');
      return;
    }
    if (!displayName.trim()) {
      Alert.alert('Name', 'Please enter your name.');
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
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        await syncAuthProfileBasics(auth.currentUser, displayName.trim());
      }
      await queryClient.invalidateQueries({ queryKey: ['userProfile', uid] });
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not save';
      Alert.alert('Something went wrong', message);
    } finally {
      setBusy(false);
    }
  };

  const onPickAvatar = async () => {
    if (!hasFirebaseConfig || !uid) {
      Alert.alert('Not available', 'Connect your account to change your photo.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo access in Settings to update your picture.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (picked.canceled || !picked.assets[0]?.uri) {
      return;
    }
    setAvatarBusy(true);
    try {
      const url = await uploadProfileAvatarFromUri(uid, picked.assets[0].uri);
      setAvatarUrl(url);
      await saveUserProfile(uid, {
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        role,
        mode,
        avatarUrl: url,
      });
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        await syncAuthProfileBasics(auth.currentUser, displayName.trim(), url);
      }
      await queryClient.invalidateQueries({ queryKey: ['userProfile', uid] });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      Alert.alert('Photo', message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const onRemoveAvatar = async () => {
    if (!hasFirebaseConfig || !uid) {
      return;
    }
    Alert.alert('Remove photo?', 'Your profile picture will be cleared.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void removeAvatarConfirmed(),
      },
    ]);
  };

  const removeAvatarConfirmed = async () => {
    if (!uid) {
      return;
    }
    setAvatarBusy(true);
    try {
      await deleteProfileAvatarObject(uid);
      setAvatarUrl(undefined);
      await saveUserProfile(uid, {
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        role,
        mode,
        avatarUrl: '',
      });
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        await syncAuthProfileBasics(auth.currentUser, displayName.trim(), null);
      }
      await queryClient.invalidateQueries({ queryKey: ['userProfile', uid] });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not remove photo';
      Alert.alert('Something went wrong', message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const onSubmitEmailChange = async () => {
    if (!newEmail.trim() || !emailPassword) {
      Alert.alert('Missing info', 'Enter a new email and your current password.');
      return;
    }
    setBusy(true);
    try {
      await updateAccountEmail(newEmail.trim(), emailPassword);
      setEmailModalOpen(false);
      setNewEmail('');
      setEmailPassword('');
      Alert.alert('Email updated', 'Use your new email next time you sign in.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not update email';
      Alert.alert('Something went wrong', message);
    } finally {
      setBusy(false);
    }
  };

  const onConfirmDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Password required', 'Enter your password to delete your account.');
      return;
    }
    setBusy(true);
    try {
      await deleteAccountPermanent(deletePassword);
      queryClient.removeQueries({ queryKey: ['userProfile'] });
      setDeleteModalOpen(false);
      setDeletePassword('');
      router.replace('/(auth)/login');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not delete account';
      Alert.alert('Something went wrong', message);
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
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#FFCC00" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface">
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: tabBarHeight + 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-lg self-center">
            <Text className="text-[28px] font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
              Profile
            </Text>
            <Text className="mt-1 text-[15px] text-gray-500">Manage your profile and preferences</Text>

            <View className="mt-6 items-center rounded-3xl border border-gray-100 bg-white px-5 py-6 shadow-md shadow-black/6">
              <Pressable onPress={() => void onPickAvatar()} disabled={busy || avatarBusy}>
                <View className="relative">
                  {resolvedPhoto ? (
                    <Image
                      key={resolvedPhoto}
                      source={{ uri: resolvedPhoto }}
                      className="h-28 w-28 rounded-3xl bg-surface-muted"
                    />
                  ) : (
                    <View className="h-28 w-28 items-center justify-center rounded-3xl bg-surface-muted">
                      <Text className="text-4xl font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                        {initial}
                      </Text>
                    </View>
                  )}
                  {avatarBusy ? (
                    <View className="absolute inset-0 items-center justify-center rounded-3xl bg-black/35">
                      <ActivityIndicator color="#fff" size="large" />
                    </View>
                  ) : null}
                </View>
              </Pressable>
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  disabled={busy || avatarBusy}
                  onPress={() => void onPickAvatar()}
                  className="rounded-full bg-primary px-4 py-2 active:opacity-90 disabled:opacity-50">
                  <Text className="text-sm font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                    Change photo
                  </Text>
                </Pressable>
                {resolvedPhoto ? (
                  <Pressable
                    disabled={busy || avatarBusy}
                    onPress={onRemoveAvatar}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 active:opacity-90 disabled:opacity-50">
                    <Text className="text-sm font-semibold text-gray-700" style={{ fontFamily: appFonts.semibold }}>
                      Remove
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <Text className="mt-3 text-center text-[20px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                {displayName.trim() || 'Your name'}
              </Text>
              <Text className="mt-1 text-center text-[14px] text-gray-500">{user?.email ?? '—'}</Text>
            </View>

            <View className="mt-5 rounded-3xl border border-gray-100 bg-white px-4 py-2 shadow-sm shadow-black/5">
              <Text className="mt-2 text-[13px] font-semibold uppercase tracking-wide text-gray-500">Display name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#9ca3af"
                className="mt-2 rounded-2xl border border-gray-200 bg-surface px-4 py-3.5 text-[16px] text-ink"
                style={{ fontFamily: appFonts.regular }}
              />
              <Text className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-gray-500">Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Mobile number"
                placeholderTextColor="#9ca3af"
                className="mt-2 rounded-2xl border border-gray-200 bg-surface px-4 py-3.5 text-[16px] text-ink"
                style={{ fontFamily: appFonts.regular }}
              />
              <Text className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-gray-500">Email</Text>
              <Text className="mt-2 text-[15px] text-ink">{user?.email ?? '—'}</Text>
              <Pressable
                disabled={busy}
                onPress={() => {
                  setNewEmail(user?.email ?? '');
                  setEmailPassword('');
                  setEmailModalOpen(true);
                }}
                className="mt-3 self-start rounded-full border border-gray-200 bg-white px-4 py-2 active:opacity-90">
                <Text className="text-sm font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                  Update email
                </Text>
              </Pressable>
            </View>

            <Text className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-gray-500">Account type</Text>
            <View className="mt-2 flex-row gap-3">
              {(['rider', 'driver'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  className={`flex-1 items-center rounded-2xl border-2 py-3.5 ${
                    role === r ? 'border-primary bg-primary/15' : 'border-gray-200 bg-white'
                  }`}>
                  <Text className="font-semibold capitalize text-ink" style={{ fontFamily: appFonts.semibold }}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-gray-500">Home experience</Text>
            <Text className="mt-1 text-[13px] text-gray-500">
              Choose what the home screen optimizes for (you can still use both rider and driver tools).
            </Text>
            <View className="mt-2 flex-row gap-3">
              {(['rider', 'driver'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className={`flex-1 items-center rounded-2xl border-2 py-3.5 ${
                    mode === m ? 'border-primary bg-primary/15' : 'border-gray-200 bg-white'
                  }`}>
                  <Text className="font-semibold capitalize text-ink" style={{ fontFamily: appFonts.semibold }}>
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>

            {role === 'driver' && hasFirebaseConfig && uid ? (
              <View className="mt-6 rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm shadow-black/5">
                <Text className="text-[16px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                  Driver availability
                </Text>
                <Text className="mt-1 text-[13px] leading-5 text-gray-600">
                  Go online before you open the request list so you can accept rides.
                </Text>
                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="text-[16px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                    {driverPresenceLoading ? '…' : driverActive ? 'Online' : 'Offline'}
                  </Text>
                  <Switch
                    value={driverActive}
                    disabled={driverPresenceLoading || onlineBusy}
                    onValueChange={(v) => void onToggleDriverOnline(v)}
                    trackColor={{ false: '#e5e7eb', true: '#FFCC00' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            ) : null}

            <Text className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-gray-500">Shortcuts</Text>
            <View className="mt-2 overflow-hidden rounded-3xl border border-gray-100 bg-white px-3 shadow-sm shadow-black/5">
              <Link href="/(app)/trip-history" asChild>
                <Pressable className="border-b border-gray-100">
                  <View className="flex-row items-center gap-3 py-3.5">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-muted">
                      <FontAwesome name="history" size={18} color="#1A1A1A" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[16px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                        Trip history
                      </Text>
                      <Text className="text-[13px] text-gray-500">Past trips and receipts</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                  </View>
                </Pressable>
              </Link>
              <SettingsRow
                icon="bookmark-o"
                label="Saved places"
                subtitle="Home, work, and favorites"
                onPress={() =>
                  Alert.alert('Saved places', 'You’ll be able to save frequent destinations in a future update.')
                }
              />
              <SettingsRow
                icon="credit-card"
                label="Payment"
                subtitle="Cards and Apple Pay will appear here"
                onPress={() =>
                  Alert.alert('Payment', 'OtterRide will support saved payment methods in a future update.')
                }
              />
            </View>

            <Pressable
              disabled={busy}
              onPress={onSave}
              className="mt-8 items-center rounded-2xl bg-primary py-4 shadow-lg shadow-amber-900/20 active:opacity-95 disabled:opacity-50">
              <Text className="text-[16px] font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
                {busy ? 'Saving…' : 'Save changes'}
              </Text>
            </Pressable>

            <Pressable
              disabled={busy}
              onPress={onSignOut}
              className="mt-3 items-center rounded-2xl border-2 border-gray-200 bg-white py-4 shadow-sm active:opacity-95">
              <Text className="text-[16px] font-semibold text-ink" style={{ fontFamily: appFonts.semibold }}>
                Sign out
              </Text>
            </Pressable>

            <Pressable
              disabled={busy}
              onPress={() => {
                setDeletePassword('');
                setDeleteModalOpen(true);
              }}
              className="mt-6 items-center py-2 active:opacity-80">
              <Text className="text-[15px] font-semibold text-red-600" style={{ fontFamily: appFonts.semibold }}>
                Delete account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={emailModalOpen} animationType="fade" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
            <Text className="text-lg font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
              Update email
            </Text>
            <Text className="mt-1 text-sm text-gray-600">Enter your new email and current password.</Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="New email"
              placeholderTextColor="#9ca3af"
              className="mt-4 rounded-2xl border border-gray-200 bg-surface px-4 py-3 text-[16px] text-ink"
            />
            <TextInput
              value={emailPassword}
              onChangeText={setEmailPassword}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor="#9ca3af"
              className="mt-3 rounded-2xl border border-gray-200 bg-surface px-4 py-3 text-[16px] text-ink"
            />
            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setEmailModalOpen(false)}
                className="flex-1 items-center rounded-2xl border border-gray-200 py-3.5">
                <Text className="font-semibold text-ink">Cancel</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => void onSubmitEmailChange()}
                className="flex-1 items-center rounded-2xl bg-primary py-3.5 disabled:opacity-50">
                <Text className="font-bold text-ink">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteModalOpen} animationType="fade" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
            <Text className="text-lg font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
              Delete account
            </Text>
            <Text className="mt-1 text-sm leading-5 text-gray-600">
              This permanently removes your OtterRide account and profile. Enter your password to confirm.
            </Text>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              className="mt-4 rounded-2xl border border-gray-200 bg-surface px-4 py-3 text-[16px] text-ink"
            />
            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setDeleteModalOpen(false)}
                className="flex-1 items-center rounded-2xl border border-gray-200 py-3.5">
                <Text className="font-semibold text-ink">Cancel</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => void onConfirmDeleteAccount()}
                className="flex-1 items-center rounded-2xl bg-red-600 py-3.5 disabled:opacity-50">
                <Text className="font-bold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
