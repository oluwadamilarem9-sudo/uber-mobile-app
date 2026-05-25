import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PlacePrediction } from '@/src/lib/placesAutocomplete';
import type { StoredPlace } from '@/src/lib/localRidePreferences';

type Props = {
  visible: boolean;
  targetLabel: string;
  query: string;
  onChangeQuery: (q: string) => void;
  onClose: () => void;
  predictions: PlacePrediction[];
  recent: StoredPlace[];
  busy: boolean;
  error: string | null;
  onPickPrediction: (p: PlacePrediction) => void;
  onPickRecent: (p: StoredPlace) => void;
};

export function ExploreMapSearchOverlay({
  visible,
  targetLabel,
  query,
  onChangeQuery,
  onClose,
  predictions,
  recent,
  busy,
  error,
  onPickPrediction,
  onPickRecent,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  const showRecent = query.trim().length < 2 && recent.length > 0;

  return (
    <View
      className="absolute inset-0 z-50 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-gray-100 px-3 py-2">
        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-gray-100">
          <FontAwesome name="arrow-left" size={18} color="#1A1A1A" />
        </Pressable>
        <View className="flex-1 flex-row items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
          <FontAwesome name="search" size={16} color="#64748b" />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder={`Search ${targetLabel}`}
            placeholderTextColor="#9ca3af"
            className="ml-2 min-h-[44px] flex-1 text-base text-ink"
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {busy ? <ActivityIndicator size="small" color="#FFD000" /> : null}
        </View>
      </View>

      {error ? (
        <Text className="px-4 py-2 text-sm text-amber-800">{error}</Text>
      ) : null}

      {showRecent ? (
        <View className="px-4 pt-3">
          <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Recent</Text>
          {recent.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                Keyboard.dismiss();
                onPickRecent(item);
              }}
              className="flex-row items-center border-b border-gray-50 py-3 active:bg-gray-50">
              <FontAwesome name="history" size={16} color="#94a3b8" />
              <View className="ml-3 flex-1">
                <Text className="text-base font-medium text-ink" numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <FlatList
        data={predictions}
        keyExtractor={(item) => item.placeId}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          predictions.length > 0 ? (
            <Text className="px-4 pb-2 pt-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              Places
            </Text>
          ) : null
        }
        ListEmptyComponent={
          !busy && query.trim().length >= 2 ? (
            <Text className="px-4 py-6 text-center text-sm text-gray-500">No places found</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              onPickPrediction(item);
            }}
            className="flex-row items-start border-b border-gray-50 px-4 py-3.5 active:bg-gray-50">
            <FontAwesome name="map-marker" size={18} color="#64748b" style={{ marginTop: 2 }} />
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                {item.mainText ?? item.description}
              </Text>
              {item.secondaryText ? (
                <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={2}>
                  {item.secondaryText}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
