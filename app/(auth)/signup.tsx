import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInView } from '@/components/ui/FadeInView';
import { getFirebaseAuth, hasFirebaseConfig } from '@/src/firebase/config';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSignUp = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      Alert.alert(
        'Firebase not configured',
        'Add your keys to `.env` (see `.env.example`) and restart Expo.',
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
      className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <FadeInView className="flex-1 justify-center px-6">
          {!hasFirebaseConfig ? (
            <View className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <Text className="text-base font-semibold text-amber-900">Firebase env missing</Text>
              <Text className="mt-2 text-sm leading-5 text-amber-900/80">
                Copy `.env.example` to `.env`, add keys, restart the dev server.
              </Text>
            </View>
          ) : null}

          <Text className="text-3xl font-bold text-gray-900">Create your account</Text>
          <Text className="mt-2 text-sm leading-5 text-gray-600">
            Sign up with email and password (Firebase Auth).
          </Text>

          <Text className="mt-8 text-sm font-medium text-gray-700">Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            className="mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base text-gray-900 shadow-sm"
          />

          <Text className="mt-4 text-sm font-medium text-gray-700">Password</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor="#9ca3af"
            className="mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base text-gray-900 shadow-sm"
          />

          <Pressable
            disabled={busy}
            onPress={onSignUp}
            android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
            className="mt-8 items-center rounded-2xl bg-primary py-4 shadow-md shadow-amber-900/20 active:opacity-95 disabled:opacity-50">
            <Text className="text-base font-semibold text-gray-900">
              {busy ? 'Please wait…' : 'Sign up'}
            </Text>
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable android_ripple={{ color: 'rgba(0,0,0,0.06)' }} className="mt-6 items-center py-2">
              <Text className="text-sm font-medium text-gray-700">
                Already have an account? <Text className="font-semibold text-gray-900">Sign in</Text>
              </Text>
            </Pressable>
          </Link>
        </FadeInView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
