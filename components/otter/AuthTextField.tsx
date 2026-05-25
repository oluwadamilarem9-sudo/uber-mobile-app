import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps, ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type IconName = ComponentProps<typeof FontAwesome>['name'];

type Props = TextInputProps & {
  label: string;
  icon: IconName;
  rightSlot?: ReactNode;
};

export function AuthTextField({ label, icon, rightSlot, ...inputProps }: Props) {
  return (
    <View>
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <View className="mt-2 flex-row items-center rounded-2xl border border-gray-200 bg-surface-muted px-3">
        <FontAwesome name={icon} size={18} color="#6b7280" />
        <TextInput
          className="ml-3 min-h-[48px] flex-1 py-3 text-base text-ink"
          placeholderTextColor="#9ca3af"
          {...inputProps}
        />
        {rightSlot ? <View className="pl-1">{rightSlot}</View> : null}
      </View>
    </View>
  );
}
