import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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

import { AppPrimaryButton } from '@/components/otter/AppPrimaryButton';
import { AuthScreenShell } from '@/components/otter/AuthScreenShell';
import { AuthTextField } from '@/components/otter/AuthTextField';
import { PhoneNumberField } from '@/components/otter/PhoneNumberField';
import { GoogleSignInBlock } from '@/components/otter/GoogleSignInBlock';
import { OtterLogo } from '@/components/otter/OtterLogo';
import { FadeInView } from '@/components/ui/FadeInView';
import { getFirebaseAuth, hasFirebaseConfig } from '@/src/firebase/config';
import { getFirestoreDb } from '@/src/firebase/firestore';
import { syncAuthProfileBasics } from '@/src/lib/profileMutations';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('NG');
  const setCountryCodePref = usePreferencesStore((s) => s.setCountryCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignUp = async () => {
    setError(null);
    const cleanedEmail = email.trim();
    if (!cleanedEmail || !cleanedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

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
      const cred = await createUserWithEmailAndPassword(auth, cleanedEmail, password);
      const uid = cred.user.uid;
      const displayName = cleanedEmail.split('@')[0]?.trim() || 'Rider';

      if (phone.trim()) {
        const db = getFirestoreDb();
        await setDoc(
          doc(db, 'users', uid),
          {
            phone: phone.trim(),
            countryCode,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      setCountryCodePref(countryCode);
      await syncAuthProfileBasics(cred.user, displayName);
      router.replace('/(app)/onboarding');
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
      <AuthScreenShell>
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

            {error ? (
              <View className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm font-semibold text-red-800">{error}</Text>
              </View>
            ) : null}

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
              <PhoneNumberField
                label="Phone number"
                value={phone}
                onChangeValue={setPhone}
                onCountryChange={(code) => {
                  setCountryCode(code);
                  setCountryCodePref(code);
                }}
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

            <View className="mt-5">
              <AuthTextField
                label="Confirm password"
                icon="lock"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                rightSlot={
                  <Pressable
                    onPress={() => setShowConfirmPassword((s) => !s)}
                    hitSlop={8}
                    className="p-2 active:opacity-70">
                    <FontAwesome
                      name={showConfirmPassword ? 'eye-slash' : 'eye'}
                      size={18}
                      color="#6b7280"
                    />
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
      </AuthScreenShell>
    </KeyboardAvoidingView>
  );
}
