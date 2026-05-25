import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppPrimaryButton } from '@/components/otter/AppPrimaryButton';
import { AuthTextField } from '@/components/otter/AuthTextField';
import { GoogleSignInBlock } from '@/components/otter/GoogleSignInBlock';
import { OtterLogo } from '@/components/otter/OtterLogo';
import { FadeInView } from '@/components/ui/FadeInView';
import { getFirebaseAuth, hasFirebaseConfig } from '@/src/firebase/config';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSignUp = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      Alert.alert(
        'Setup required',
        'This build is missing backend configuration. Complete setup and restart the app before creating an account.',
      );
      return;
    }
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign-up failed';
      Alert.alert('Could not create account', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface">
      <SafeAreaView edges={['top']} className="flex-row items-center justify-between bg-surface px-4 pb-2">
        <Link href="/(auth)/login" asChild>
          <Pressable className="h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted active:opacity-80">
            <FontAwesome name="chevron-left" size={18} color="#1A1A1A" />
          </Pressable>
        </Link>
        <OtterLogo compact />
        <View className="h-10 w-10" />
      </SafeAreaView>

      <View className="flex-1 rounded-t-[28px] bg-white px-6 pt-2 shadow-lg shadow-black/10">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
          <FadeInView>
            {!hasFirebaseConfig ? (
              <View className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-base font-semibold text-amber-900">Account services unavailable</Text>
                <Text className="mt-2 text-sm leading-5 text-amber-900/80">
                  This device is not connected to OtterRide cloud yet. Configure the app bundle, then restart.
                </Text>
              </View>
            ) : null}

            <Text className="text-2xl font-bold text-ink">Create an account</Text>
            <Text className="mt-2 text-sm leading-5 text-gray-600">
              Create your account to start booking rides with OtterRide.
            </Text>

            <View className="mt-8">
              <AuthTextField
                label="Email"
                icon="envelope"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
              />
            </View>

            <View className="mt-5">
              <AuthTextField
                label="Password"
                icon="lock"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                rightSlot={
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={8}
                    className="p-2 active:opacity-70">
                    <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color="#6b7280" />
                  </Pressable>
                }
              />
            </View>

            <View className="mt-8">
              <AppPrimaryButton
                label="Sign up"
                onPress={() => void onSignUp()}
                disabled={busy}
                loading={busy}
              />
            </View>

            <GoogleSignInBlock label="Sign up with Google" disabled={busy} />

            <Text className="mt-6 text-center text-xs leading-5 text-gray-500">
              We&apos;ll send important trip updates to the email you provide.
            </Text>

            <Link href="/(auth)/login" asChild>
              <Pressable className="mt-8 items-center py-2 active:opacity-80">
                <Text className="text-sm text-gray-600">
                  Already have an account? <Text className="font-bold text-ink">Sign in</Text>
                </Text>
              </Pressable>
            </Link>
          </FadeInView>
        </ScrollView>
      </View>
      <SafeAreaView edges={['bottom']} className="bg-white" />
    </KeyboardAvoidingView>
  );
}
