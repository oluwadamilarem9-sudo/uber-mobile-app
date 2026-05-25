import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);

  const onSignIn = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      Alert.alert(
        'Setup required',
        'This build is missing backend configuration. Ask your administrator or check the project setup guide, then restart the app.',
      );
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign-in failed';
      Alert.alert('Could not sign in', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface">
      <SafeAreaView edges={['top']} className="bg-surface">
        <View className="items-center px-6 pb-5 pt-2">
          <OtterLogo />
          <Text className="mt-2 text-sm font-medium text-gray-500">Quick, simple rides.</Text>
        </View>
      </SafeAreaView>

      <View className="flex-1 rounded-t-[28px] bg-white px-6 pt-2 shadow-lg shadow-black/10">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 16 }}>
          <FadeInView>
            {!hasFirebaseConfig ? (
              <View className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-base font-semibold text-amber-900">Account services unavailable</Text>
                <Text className="mt-2 text-sm leading-5 text-amber-900/80">
                  This device is not connected to OtterRide cloud yet. Configure the app bundle, then restart.
                </Text>
              </View>
            ) : null}

            <Text className="text-2xl font-bold text-ink">Welcome back</Text>
            <Text className="mt-2 text-sm leading-5 text-gray-600">
              Sign in with the email and password you used when you joined OtterRide.
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
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
              />
            </View>

            <View className="mt-5 flex-row items-center justify-between">
              <Pressable
                onPress={() => setRemember((v) => !v)}
                className="flex-row items-center gap-2 active:opacity-80">
                <View
                  className={`h-5 w-5 items-center justify-center rounded-md border ${
                    remember ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                  }`}>
                  {remember ? <FontAwesome name="check" size={12} color="#1A1A1A" /> : null}
                </View>
                <Text className="text-sm text-gray-700">Remember me</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Reset password',
                    'Password reset from the app is coming soon. Use the “Forgot password” link on the sign-in help page from your administrator if available.',
                  )
                }>
                <Text className="text-sm font-bold text-ink">Forgot password?</Text>
              </Pressable>
            </View>

            <View className="mt-8">
              <AppPrimaryButton
                label="Sign in"
                onPress={() => void onSignIn()}
                disabled={busy}
                loading={busy}
              />
            </View>

            <GoogleSignInBlock disabled={busy} />

            <Text className="mt-6 text-center text-xs leading-5 text-gray-500">
              Sign in with email or Google. Your account is secured by OtterRide.
            </Text>

            <Link href="/(auth)/signup" asChild>
              <Pressable className="mt-8 items-center py-2 active:opacity-80">
                <Text className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Text className="font-bold text-ink">Create an account</Text>
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
