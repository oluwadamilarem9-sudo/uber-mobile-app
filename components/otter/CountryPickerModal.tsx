import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type Country = {
  code: string; // ISO-ish code
  name: string;
  dialCode: string; // +234
  flag: string; // emoji
};

const COUNTRIES: Country[] = [
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
];

type Props = {
  visible: boolean;
  value: Country;
  onClose: () => void;
  onSelect: (c: Country) => void;
};

export function CountryPickerModal({ visible, value, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) {
      return COUNTRIES;
    }
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(t) || c.dialCode.includes(t));
  }, [q]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center border-b border-gray-100 px-4 py-3">
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-80">
            <FontAwesome name="close" size={16} color="#111" />
          </Pressable>
          <Text className="flex-1 text-lg font-bold text-ink">Country</Text>
          <Text className="text-sm font-semibold text-gray-500">
            {value.flag} {value.dialCode}
          </Text>
        </View>

        <View className="px-4 pt-4">
          <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-3">
            <FontAwesome name="search" size={16} color="#64748b" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search country"
              placeholderTextColor="#9ca3af"
              className="ml-2 min-h-[48px] flex-1 text-base text-ink"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}
          renderItem={({ item }) => {
            const active = item.code === value.code;
            return (
              <Pressable
                onPress={() => onSelect(item)}
                className={`flex-row items-center rounded-2xl px-4 py-3 ${active ? 'bg-primary/15' : 'bg-white'}`}
                style={{ marginBottom: 10 }}>
                <Text className="text-xl">{item.flag}</Text>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-ink">{item.name}</Text>
                  <Text className="mt-0.5 text-sm text-gray-500">{item.dialCode}</Text>
                </View>
                {active ? <FontAwesome name="check" size={16} color="#1A1A1A" /> : null}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

export function getDefaultCountry(): Country {
  return COUNTRIES[0];
}

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export { COUNTRIES };

