import { ActivityIndicator, Text, type PressableProps } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { hapticImpactLight } from '@/src/lib/haptics';

type Props = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
};

export function AppPrimaryButton({
  label,
  loading,
  variant = 'primary',
  disabled,
  className,
  onPress,
  ...rest
}: Props) {
  const base =
    'items-center justify-center rounded-2xl py-3.5 px-4 active:opacity-95 disabled:opacity-50';
  const skin =
    variant === 'primary'
      ? 'bg-primary shadow-md shadow-amber-900/15'
      : 'border-2 border-gray-200 bg-white';

  return (
    <PressableScale
      {...rest}
      disabled={disabled || loading}
      android_ripple={{ color: variant === 'primary' ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)' }}
      className={[base, skin, className].filter(Boolean).join(' ')}
      onPress={(e) => {
        if (!disabled && !loading) {
          hapticImpactLight();
        }
        onPress?.(e);
      }}
      hapticOnPressIn={false}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#1A1A1A' : '#1A1A1A'} />
      ) : (
        <Text className="text-base font-bold text-ink">{label}</Text>
      )}
    </PressableScale>
  );
}
