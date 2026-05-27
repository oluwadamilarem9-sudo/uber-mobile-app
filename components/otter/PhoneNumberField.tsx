import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CountryPickerModal, getDefaultCountry, type Country } from '@/components/otter/CountryPickerModal';

type Props = {
  label: string;
  value: string;
  onChangeValue: (e164Like: string) => void;
  onCountryChange?: (countryCode: string) => void;
};

function digitsOnly(s: string) {
  return s.replace(/[^\d]/g, '');
}

export function PhoneNumberField({ label, value, onChangeValue, onCountryChange }: Props) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<Country>(() => getDefaultCountry());

  const localNumber = useMemo(() => {
    // Value stored as `${dialCode}${digits}`
    const digits = digitsOnly(value);
    const dialDigits = digitsOnly(country.dialCode);
    if (digits.startsWith(dialDigits)) {
      return digits.slice(dialDigits.length);
    }
    return digits;
  }, [value, country.dialCode]);

  return (
    <View>
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <View className="mt-2 flex-row items-center rounded-2xl border border-gray-200 bg-surface-muted px-3">
        <Pressable
          onPress={() => setOpen(true)}
          className="mr-2 flex-row items-center rounded-xl bg-white px-2.5 py-2 active:opacity-80">
          <Text className="text-base">{country.flag}</Text>
          <Text className="ml-2 text-sm font-bold text-ink">{country.dialCode}</Text>
          <FontAwesome name="chevron-down" size={12} color="#6b7280" style={{ marginLeft: 8 }} />
        </Pressable>
        <TextInput
          value={localNumber}
          onChangeText={(t) => {
            const merged = `${country.dialCode}${digitsOnly(t)}`;
            onChangeValue(merged);
          }}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor="#9ca3af"
          className="min-h-[48px] flex-1 py-3 text-base text-ink"
        />
      </View>

      <CountryPickerModal
        visible={open}
        value={country}
        onClose={() => setOpen(false)}
        onSelect={(c) => {
          setCountry(c);
          onCountryChange?.(c.code);
          const merged = `${c.dialCode}${digitsOnly(localNumber)}`;
          onChangeValue(merged);
          setOpen(false);
        }}
      />
    </View>
  );
}

