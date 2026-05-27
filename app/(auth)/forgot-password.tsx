import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
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
import { FadeInView } from '@/components/ui/FadeInView';
import { getFirebaseAuth, hasFirebaseConfig } from '@/src/firebase/config';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSendReset = async () => {
    setError(null);
    const cleanedEmail = email.trim();
    if (!cleanedEmail || !cleanedEmail.includes('@')) {
      setError('Please enter the email address for your account.');
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      Alert.alert(
        'Setup required',
        'This build is missing backend configuration. Complete setup and restart the app.',
      );
      return;
    }

    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, cleanedEmail);
      setSent(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not send reset email';
      setError(message);
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
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 16 }}>
          <FadeInView>
            {!hasFirebaseConfig ? (
              <View className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-base font-semibold text-amber-900">
                  Account services unavailable
                </Text>
                <Text className="mt-2 text-sm leading-5 text-amber-900/80">
                  Connect this device to OtterRide cloud, then try again.
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => router.back()}
              className="mb-4 flex-row items-center gap-2 self-start active:opacity-80">
              <FontAwesome name="chevron-left" size={14} color="#6b7280" />
              <Text className="text-sm font-semibold text-gray-600">Back to sign in</Text>
            </Pressable>

            <Text className="text-2xl font-bold text-ink">Reset password</Text>
            <Text className="mt-2 text-sm leading-5 text-gray-600">
              {sent
                ? 'Check your inbox for a link to choose a new password. It may take a minute to arrive.'
                : 'Enter your account email and we will send you a secure reset link.'}
            </Text>

            {error ? (
              <View className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm font-semibold text-red-800">{error}</Text>
              </View>
            ) : null}

            {sent ? (
              <View className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <Text className="text-sm font-semibold text-emerald-900">
                  Email sent to {email.trim()}
                </Text>
                <Text className="mt-2 text-sm text-emerald-800/90">
                  Open the link on this device or any browser, then return here to sign in.
                </Text>
              </View>
            ) : (
              <>
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

                <View className="mt-8">
                  <AppPrimaryButton
                    label="Send reset link"
                    onPress={() => void onSendReset()}
                    disabled={busy}
                    loading={busy}
                  />
                </View>
              </>
            )}

            <Link href="/(auth)/login" asChild>
              <Pressable className="mt-8 items-center py-2 active:opacity-80">
                <Text className="text-sm text-gray-600">
                  Remembered your password? <Text className="font-bold text-ink">Sign in</Text>
                </Text>
              </Pressable>
            </Link>
          </FadeInView>
        </ScrollView>
      </AuthScreenShell>
    </KeyboardAvoidingView>
  );
}
