import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  InteractionManager,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import MapView, { Marker, Polyline, type MapType, type Region } from 'react-native-maps';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreMapSearchOverlay } from '@/components/maps/explore/ExploreMapSearchOverlay';
import { ExploreRoutePanel } from '@/components/maps/explore/ExploreRoutePanel';
import { useColorScheme } from '@/components/useColorScheme';
import { useForegroundLocation } from '@/src/hooks/useForegroundLocation';
import {
  loadRecentDestinations,
  pushRecentDestination,
  type StoredPlace,
} from '@/src/lib/localRidePreferences';
import { fetchRoute, type LatLng, type RouteMode } from '@/src/lib/directions';
import { mapDarkStyle } from '@/src/lib/mapDarkStyle';
import { GOOGLE_MAPS_KEY, MAP_FEATURES, MAP_PROVIDER } from '@/src/lib/mapConfig';
import {
  fetchPlaceDetails,
  fetchPlacePredictions,
  reverseGeocode,
  type PlacePrediction,
} from '@/src/lib/placesAutocomplete';

const WIN_H = Dimensions.get('window').height;
const SPRING = { damping: 24, stiffness: 280, mass: 0.85 };

type SearchTarget = 'origin' | 'destination';

function nearestSnapWorklet(h: number, snaps: readonly number[]) {
  'worklet';
  let best = snaps[0];
  let bestD = Math.abs(h - best);
  for (let i = 1; i < snaps.length; i++) {
    const d = Math.abs(h - snaps[i]);
    if (d < bestD) {
      bestD = d;
      best = snaps[i];
    }
  }
  return best;
}

export function ExploreMapScreen() {
  const mapRef = useRef<MapView>(null);
  const [mapMounted, setMapMounted] = useState(false);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const systemScheme = useColorScheme();

  const [mapType, setMapType] = useState<MapType>('standard');
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const useDarkStyle = mapType === 'standard' && systemScheme === 'dark';

  const { state: locState, refresh } = useForegroundLocation({ watch: true });
  const gpsOrigin = locState.status === 'ready' ? locState.coords : null;

  const [originOverride, setOriginOverride] = useState<LatLng | null>(null);
  const [originLabel, setOriginLabel] = useState('Your location');
  const [manualOrigin, setManualOrigin] = useState(false);

  const [destination, setDestination] = useState<LatLng | null>(null);
  const [destinationLabel, setDestinationLabel] = useState('');

  const [routeFull, setRouteFull] = useState<LatLng[]>([]);
  const [routeDraw, setRouteDraw] = useState<LatLng[]>([]);
  const [routeMeta, setRouteMeta] = useState<{ durationSec: number; distanceMeters: number } | null>(null);
  const [routing, setRouting] = useState(false);
  const [travelMode, setTravelMode] = useState<RouteMode>('driving');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('destination');
  const [search, setSearch] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [placesBusy, setPlacesBusy] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [recentPlaces, setRecentPlaces] = useState<StoredPlace[]>([]);

  const origin = manualOrigin && originOverride ? originOverride : gpsOrigin;

  const snapHeights = useMemo(
    () => [Math.round(WIN_H * 0.22), Math.round(WIN_H * 0.42), Math.round(WIN_H * 0.68)],
    [],
  );
  const sheetH = useSharedValue(snapHeights[1]);
  const dragStartH = useSharedValue(snapHeights[1]);
  const [sheetHeightJs, setSheetHeightJs] = useState(snapHeights[1]);

  const setSheetHeightJsSafe = useCallback((h: number) => {
    setSheetHeightJs(h);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onBegin(() => {
          dragStartH.value = sheetH.value;
        })
        .onUpdate((e) => {
          const next = dragStartH.value - e.translationY;
          const min = snapHeights[0];
          const max = snapHeights[2];
          sheetH.value = next < min ? min : next > max ? max : next;
        })
        .onEnd(() => {
          const target = nearestSnapWorklet(sheetH.value, snapHeights);
          runOnJS(setSheetHeightJsSafe)(target);
          sheetH.value = withSpring(target, SPRING);
        }),
    [dragStartH, setSheetHeightJsSafe, sheetH, snapHeights],
  );

  const sheetAnimStyle = useAnimatedStyle(() => ({ height: sheetH.value }));
  const bottomPad = Math.max(insets.bottom, 10) + tabBarHeight + 10;

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setMapMounted(true));
    return () => task.cancel();
  }, []);

  useEffect(() => {
    void loadRecentDestinations().then(setRecentPlaces);
  }, []);

  useEffect(() => {
    if (!manualOrigin && gpsOrigin) {
      setOriginLabel('Your location');
    }
  }, [gpsOrigin?.latitude, gpsOrigin?.longitude, manualOrigin]);

  useEffect(() => {
    if (!origin || !mapRef.current) {
      return;
    }
    mapRef.current.animateToRegion(
      {
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      400,
    );
  }, [origin?.latitude, origin?.longitude]);

  const initialRegion: Region = useMemo(() => {
    const center = origin ?? { latitude: 37.7749, longitude: -122.4194 };
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [origin]);

  useEffect(() => {
    const q = search.trim();
    if (!GOOGLE_MAPS_KEY || q.length < 2) {
      setPredictions([]);
      setPlacesError(null);
      return;
    }

    const handle = setTimeout(() => {
      setPlacesBusy(true);
      setPlacesError(null);
      void fetchPlacePredictions(q, GOOGLE_MAPS_KEY, origin ?? undefined)
        .then((p) => setPredictions(p.slice(0, 10)))
        .catch((e) => {
          setPredictions([]);
          setPlacesError(e instanceof Error ? e.message : 'Search failed');
        })
        .finally(() => setPlacesBusy(false));
    }, 280);

    return () => clearTimeout(handle);
  }, [search, origin]);

  useEffect(() => {
    if (routeFull.length < 2) {
      setRouteDraw([]);
      return;
    }

    let cancelled = false;
    setRouteDraw([]);
    const full = routeFull;
    const step = Math.max(1, Math.ceil(full.length / 28));
    let idx = 0;

    const tick = () => {
      if (cancelled) {
        return;
      }
      idx += step;
      if (idx >= full.length) {
        setRouteDraw(full);
        return;
      }
      setRouteDraw(full.slice(0, idx));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
    };
  }, [routeFull]);

  useEffect(() => {
    if (routeDraw.length < 2 || !mapRef.current) {
      return;
    }
    const pts = [...routeDraw];
    if (origin) {
      pts.push(origin);
    }
    if (destination) {
      pts.push(destination);
    }
    const topPad = insets.top + 120;
    const bottomPadFit = bottomPad + sheetHeightJs + 16;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(pts, {
        edgePadding: { top: topPad, right: 40, bottom: bottomPadFit, left: 40 },
        animated: true,
      });
    }, 100);
    return () => clearTimeout(t);
  }, [routeDraw, origin, destination, bottomPad, sheetHeightJs, insets.top]);

  useEffect(() => {
    if (!origin || !destination) {
      setRouteFull([]);
      setRouteDraw([]);
      setRouteMeta(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        if (cancelled || !origin || !destination) {
          return;
        }
        if (!GOOGLE_MAPS_KEY) {
          return;
        }
        setRouting(true);
        try {
          const route = await fetchRoute(origin, destination, GOOGLE_MAPS_KEY, travelMode);
          if (!cancelled) {
            setRouteFull(route.coordinates);
            setRouteMeta({
              durationSec: route.durationSec,
              distanceMeters: route.distanceMeters,
            });
          }
        } catch (e) {
          if (!cancelled) {
            const message = e instanceof Error ? e.message : 'Route failed';
            Alert.alert('Route', message);
            setRouteFull([]);
            setRouteDraw([]);
            setRouteMeta(null);
          }
        } finally {
          if (!cancelled) {
            setRouting(false);
          }
        }
      })();
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
    travelMode,
  ]);

  const applyPlace = useCallback(
    async (target: SearchTarget, coords: LatLng, label: string) => {
      if (target === 'origin') {
        setManualOrigin(true);
        setOriginOverride(coords);
        setOriginLabel(label);
      } else {
        setDestination(coords);
        setDestinationLabel(label);
        await pushRecentDestination({ label, latitude: coords.latitude, longitude: coords.longitude });
        setRecentPlaces(await loadRecentDestinations());
      }
      setSearchOpen(false);
      setSearch('');
      setPredictions([]);
    },
    [],
  );

  const onPickPrediction = useCallback(
    async (p: PlacePrediction) => {
      if (!GOOGLE_MAPS_KEY) {
        return;
      }
      setPlacesBusy(true);
      try {
        const details = await fetchPlaceDetails(p.placeId, GOOGLE_MAPS_KEY);
        if (details) {
          const label = details.name || details.formattedAddress || p.description;
          await applyPlace(searchTarget, details.location, label);
        }
      } catch {
        Alert.alert('Place', 'Could not load that place.');
      } finally {
        setPlacesBusy(false);
      }
    },
    [applyPlace, searchTarget],
  );

  const onPickRecent = useCallback(
    async (p: StoredPlace) => {
      await applyPlace(searchTarget, { latitude: p.latitude, longitude: p.longitude }, p.label);
    },
    [applyPlace, searchTarget],
  );

  const openSearch = useCallback((target: SearchTarget) => {
    setSearchTarget(target);
    setSearch('');
    setPredictions([]);
    setSearchOpen(true);
  }, []);

  const onMapPress = useCallback(
    async (e: { nativeEvent: { coordinate: LatLng } }) => {
      if (searchOpen) {
        return;
      }
      Keyboard.dismiss();
      const coord = e.nativeEvent.coordinate;
      setDestination(coord);
      setSearch('');
      setPredictions([]);

      if (GOOGLE_MAPS_KEY) {
        const label = await reverseGeocode(coord.latitude, coord.longitude, GOOGLE_MAPS_KEY);
        setDestinationLabel(label);
        await pushRecentDestination({
          label,
          latitude: coord.latitude,
          longitude: coord.longitude,
        });
        setRecentPlaces(await loadRecentDestinations());
      } else {
        setDestinationLabel('Dropped pin');
      }
    },
    [searchOpen],
  );

  const onSwap = useCallback(() => {
    if (!origin || !destination) {
      return;
    }
    setManualOrigin(true);
    setOriginOverride(destination);
    setOriginLabel(destinationLabel);
    setDestination(origin);
    setDestinationLabel(originLabel);
  }, [origin, destination, destinationLabel, originLabel]);

  const onClear = useCallback(() => {
    setDestination(null);
    setDestinationLabel('');
    setRouteFull([]);
    setRouteDraw([]);
    setRouteMeta(null);
    setManualOrigin(false);
    setOriginOverride(null);
    setOriginLabel('Your location');
  }, []);

  const recenterOnUser = useCallback(() => {
    if (!gpsOrigin || !mapRef.current) {
      void refresh();
      return;
    }
    setManualOrigin(false);
    setOriginOverride(null);
    setOriginLabel('Your location');
    mapRef.current.animateToRegion(
      {
        latitude: gpsOrigin.latitude,
        longitude: gpsOrigin.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      350,
    );
  }, [gpsOrigin, refresh]);

  const cycleMapType = useCallback(() => {
    setMapType((t) => {
      if (t === 'standard') {
        return 'satellite';
      }
      if (t === 'satellite') {
        return 'hybrid';
      }
      return 'standard';
    });
    setLayerMenuOpen(false);
  }, []);

  if (locState.status === 'denied' || locState.status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-center text-base text-gray-800">{locState.message}</Text>
        <Pressable onPress={() => void refresh()} className="mt-6 rounded-3xl bg-primary px-8 py-3.5 shadow-md">
          <Text className="font-bold text-ink">Try again</Text>
        </Pressable>
      </View>
    );
  }

  const mapTypeLabel =
    mapType === 'satellite' ? 'Satellite' : mapType === 'hybrid' ? 'Hybrid' : 'Map';

  return (
    <View className="flex-1 bg-surface">
      {mapMounted ? (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={MAP_PROVIDER}
          mapType={mapType}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsTraffic={MAP_FEATURES.traffic}
          showsBuildings
          showsIndoors
          loadingEnabled
          customMapStyle={useDarkStyle ? [...mapDarkStyle] : undefined}
          onPress={onMapPress}>
          {manualOrigin && origin ? (
            <Marker coordinate={origin} title="Start" pinColor="#22c55e" />
          ) : null}
          {destination ? (
            <Marker coordinate={destination} title={destinationLabel || 'Destination'} pinColor="#ea4335" />
          ) : null}
          {routeDraw.length > 1 ? (
            <Polyline
              coordinates={routeDraw}
              strokeColor="#4285F4"
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
            />
          ) : null}
        </MapView>
      ) : (
        <View className="flex-1 items-center justify-center bg-gray-100">
          <ActivityIndicator size="large" color="#FFD000" />
        </View>
      )}

      {!searchOpen ? (
        <>
          <Pressable
            onPress={() => openSearch('destination')}
            className="absolute left-4 right-4 flex-row items-center rounded-full border border-gray-200 bg-white px-4 py-3.5 shadow-lg shadow-black/15"
            style={{ top: insets.top + 8 }}>
            <FontAwesome name="search" size={18} color="#5f6368" />
            <Text className="ml-3 flex-1 text-base text-gray-500" numberOfLines={1}>
              {destinationLabel || 'Search here'}
            </Text>
          </Pressable>

          <View className="absolute right-3 gap-2" style={{ top: insets.top + 72 }}>
            <Pressable
              onPress={recenterOnUser}
              className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-md shadow-black/15 active:opacity-90">
              <FontAwesome name="location-arrow" size={18} color="#1A73E8" />
            </Pressable>
            <Pressable
              onPress={() => setLayerMenuOpen((v) => !v)}
              className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-md shadow-black/15 active:opacity-90">
              <FontAwesome name="layer-group" size={16} color="#5f6368" />
            </Pressable>
            {layerMenuOpen ? (
              <Pressable
                onPress={cycleMapType}
                className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
                <Text className="text-xs font-semibold text-ink">{mapTypeLabel}</Text>
                <Text className="mt-0.5 text-[10px] text-gray-500">Tap to change</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}

      {locState.status === 'requesting' ? (
        <View className="absolute left-0 right-0 items-center" style={{ top: insets.top + 64 }}>
          <View className="rounded-full bg-white/95 px-4 py-2 shadow">
            <ActivityIndicator color="#FFD000" />
          </View>
        </View>
      ) : null}

      <ExploreMapSearchOverlay
        visible={searchOpen}
        targetLabel={searchTarget === 'origin' ? 'start point' : 'destination'}
        query={search}
        onChangeQuery={setSearch}
        onClose={() => {
          setSearchOpen(false);
          setSearch('');
          setPredictions([]);
        }}
        predictions={predictions}
        recent={recentPlaces}
        busy={placesBusy}
        error={placesError}
        onPickPrediction={(p) => void onPickPrediction(p)}
        onPickRecent={(p) => void onPickRecent(p)}
      />

      {!searchOpen ? (
        <View className="absolute left-0 right-0 px-2" style={{ bottom: 0, paddingBottom: bottomPad }}>
          <Animated.View
            style={[sheetAnimStyle, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
            className="overflow-hidden border border-gray-100 bg-white shadow-2xl shadow-black/20">
            <GestureDetector gesture={panGesture}>
              <View className="items-center pb-1 pt-3">
                <View className="h-1 w-10 rounded-full bg-gray-300" />
              </View>
            </GestureDetector>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <ExploreRoutePanel
                originLabel={originLabel}
                destinationLabel={destinationLabel}
                locating={locState.status === 'requesting'}
                travelMode={travelMode}
                onChangeMode={setTravelMode}
                onPressOrigin={() => openSearch('origin')}
                onPressDestination={() => openSearch('destination')}
                onSwap={onSwap}
                routeMeta={routeMeta}
                routing={routing}
                onClear={onClear}
              />
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}
