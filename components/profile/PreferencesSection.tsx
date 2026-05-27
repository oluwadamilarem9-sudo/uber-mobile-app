import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CountryPickerModal,
  getCountryByCode,
  getDefaultCountry,
  type Country,
} from '@/components/otter/CountryPickerModal';
import { CURRENCIES } from '@/src/lib/currency';
import { usePreferencesStore } from '@/src/stores/preferencesStore';

export function PreferencesSection() {
  const insets = useSafeAreaInsets();
  const currency = usePreferencesStore((s) => s.currency);
  const countryCode = usePreferencesStore((s) => s.countryCode);
  const setCurrency = usePreferencesStore((s) => s.setCurrency);
  const setCountryCode = usePreferencesStore((s) => s.setCountryCode);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const currencyLabel = CURRENCIES.find((c) => c.code === currency)?.name ?? currency;
  const country: Country = getCountryByCode(countryCode) ?? getDefaultCountry();

  return (
    <View className="mt-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md shadow-black/6">
      <Text className="border-b border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
        Preferences
      </Text>

      <Pressable
        onPress={() => setCountryOpen(true)}
        className="mx-4 mb-2 mt-4 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-surface-muted px-4 py-3.5 active:opacity-90">
        <View className="flex-row items-center gap-3">
          <Text className="text-lg">{country.flag}</Text>
          <View>
            <Text className="text-sm font-semibold text-ink">Country</Text>
            <Text className="mt-0.5 text-xs text-gray-500">{country.name}</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
      </Pressable>

      <Pressable
        onPress={() => setCurrencyOpen(true)}
        className="mx-4 mb-4 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-surface-muted px-4 py-3.5 active:opacity-90">
        <View className="flex-row items-center gap-3">
          <FontAwesome name="money" size={18} color="#1A1A1A" />
          <View>
            <Text className="text-sm font-semibold text-ink">Currency</Text>
            <Text className="mt-0.5 text-xs text-gray-500">{currencyLabel}</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
      </Pressable>

      <CountryPickerModal
        visible={countryOpen}
        value={country}
        onClose={() => setCountryOpen(false)}
        onSelect={(c) => {
          setCountryCode(c.code);
          setCountryOpen(false);
        }}
      />

      <Modal visible={currencyOpen} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center border-b border-gray-100 px-4 py-3">
            <Pressable
              onPress={() => setCurrencyOpen(false)}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <FontAwesome name="close" size={16} color="#111" />
            </Pressable>
            <Text className="text-lg font-bold text-ink">Currency</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
            {CURRENCIES.map((c) => {
              const active = c.code === currency;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setCurrency(c.code);
                    setCurrencyOpen(false);
                  }}
                  className={`mb-2 flex-row items-center rounded-2xl px-4 py-3.5 ${
                    active ? 'bg-primary/20' : 'bg-gray-50'
                  }`}>
                  <Text className="text-lg font-bold text-ink">{c.symbol}</Text>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-ink">{c.code}</Text>
                    <Text className="text-sm text-gray-500">{c.name}</Text>
                  </View>
                  {active ? <FontAwesome name="check" size={16} color="#1A1A1A" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
