import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { GOOGLE_MAPS_KEY } from '@/src/lib/mapConfig';
import {
  fetchPlaceDetails,
  fetchPlacePredictions,
  type PlacePrediction,
} from '@/src/lib/placesAutocomplete';
import type { LatLng } from '@/src/lib/directions';

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeLabel: (label: string) => void;
  onSelectPlace: (coords: LatLng, label: string) => void;
  bias?: LatLng;
  dotColor?: string;
};

export function PlaceSearchField({
  label,
  placeholder,
  value,
  onChangeLabel,
  onSelectPlace,
  bias,
  dotColor = '#22c55e',
}: Props) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const q = value.trim();
    if (!GOOGLE_MAPS_KEY || q.length < 2) {
      setPredictions([]);
      return;
    }
    const t = setTimeout(() => {
      setBusy(true);
      void fetchPlacePredictions(q, GOOGLE_MAPS_KEY, bias)
        .then((p) => setPredictions(p.slice(0, 5)))
        .catch(() => setPredictions([]))
        .finally(() => setBusy(false));
    }, 280);
    return () => clearTimeout(t);
  }, [value, bias]);

  const onPick = async (p: PlacePrediction) => {
    if (!GOOGLE_MAPS_KEY) {
      return;
    }
    setBusy(true);
    try {
      const details = await fetchPlaceDetails(p.placeId, GOOGLE_MAPS_KEY);
      if (details) {
        const lbl = details.name || details.formattedAddress || p.description;
        onChangeLabel(lbl);
        onSelectPlace(details.location, lbl);
        setPredictions([]);
        setFocused(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <View className="flex-row items-center gap-3">
        <View className="h-3 w-3 rounded-full" style={{ backgroundColor: dotColor }} />
        <View className="min-w-0 flex-1">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</Text>
          <View className="mt-1.5 flex-row items-center rounded-2xl border border-gray-200 bg-white px-3">
            <FontAwesome name="search" size={14} color="#9ca3af" />
            <TextInput
              value={value}
              onChangeText={onChangeLabel}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              className="ml-2 min-h-[46px] flex-1 text-base text-ink"
              autoCorrect={false}
            />
            {busy ? <ActivityIndicator size="small" color="#FFD000" /> : null}
          </View>
        </View>
      </View>

      {focused && predictions.length > 0 ? (
        <View className="ml-6 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
          {predictions.map((item) => (
            <Pressable
              key={item.placeId}
              onPress={() => void onPick(item)}
              className="border-b border-gray-50 px-3 py-3 active:bg-gray-50">
              <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                {item.mainText ?? item.description}
              </Text>
              {item.secondaryText ? (
                <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
                  {item.secondaryText}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
