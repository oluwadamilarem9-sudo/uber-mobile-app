import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { GoogleSignInButton } from '@/components/otter/GoogleSignInButton';
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn';
import { hasGoogleOAuthConfigForPlatform, logGoogleRedirectUriForSetup } from '@/src/lib/googleAuth';
import { hasFirebaseConfig } from '@/src/firebase/config';

type Props = {
  disabled?: boolean;
  label?: string;
};

/**
 * Renders Google sign-in only when platform OAuth IDs exist.
 * Avoids calling `useIdTokenAuthRequest` on Android without `androidClientId` (hard crash).
 */
export function GoogleSignInBlock({ disabled, label }: Props) {
  if (!hasFirebaseConfig || !hasGoogleOAuthConfigForPlatform()) {
    return null;
  }
  return <GoogleSignInBlockInner disabled={disabled} label={label} />;
}

function GoogleSignInBlockInner({ disabled, label }: Props) {
  useEffect(() => {
    logGoogleRedirectUriForSetup();
  }, []);

  const { signInWithGoogle, busy } = useGoogleSignIn();

  return (
    <>
      <View className="my-5 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-gray-200" />
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">or</Text>
        <View className="h-px flex-1 bg-gray-200" />
      </View>
      <GoogleSignInButton
        label={label}
        onPress={() => void signInWithGoogle()}
        loading={busy}
        disabled={disabled}
      />
    </>
  );
}
