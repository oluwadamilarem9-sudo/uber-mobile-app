import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { appFonts } from '@/src/theme/fonts';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
};

export function GoogleSignInButton({
  onPress,
  disabled,
  loading,
  label = 'Continue with Google',
}: Props) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      className="flex-row items-center justify-center rounded-2xl border-2 border-gray-200 bg-white py-3.5 active:opacity-95 disabled:opacity-50">
      {loading ? (
        <ActivityIndicator color="#1A1A1A" />
      ) : (
        <View className="flex-row items-center gap-3">
          <FontAwesome name="google" size={18} color="#1A1A1A" />
          <Text className="text-base font-bold text-ink" style={{ fontFamily: appFonts.bold }}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
