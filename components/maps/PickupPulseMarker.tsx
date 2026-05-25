import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { LatLng } from '@/src/lib/directions';

type Props = {
  coordinate: LatLng;
};

/**
 * Custom animated markers inside MapView crash many Android builds.
 * Use a native pin on Android; animated view on iOS with tracksViewChanges off.
 */
export function PickupPulseMarker({ coordinate }: Props) {
  if (Platform.OS === 'android') {
    return <Marker coordinate={coordinate} pinColor="#FFD000" title="Pickup" zIndex={100} />;
  }

  return <PickupPulseMarkerIos coordinate={coordinate} />;
}

function PickupPulseMarkerIos({ coordinate }: Props) {
  const pulse = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    bob.value = withRepeat(
      withTiming(-5, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [bob, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.42 }],
    opacity: 0.35 + pulse.value * 0.35,
  }));

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false} zIndex={100}>
      <View className="items-center" style={{ width: 56, height: 64 }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 14,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255, 208, 0, 0.45)',
            },
            ringStyle,
          ]}
        />
        <Animated.View style={pinStyle}>
          <View
            className="items-center justify-center rounded-full border-2 border-white bg-primary shadow-md"
            style={{
              width: 40,
              height: 40,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
            }}>
            <FontAwesome name="map-marker" size={22} color="#1A1A1A" />
          </View>
        </Animated.View>
      </View>
    </Marker>
  );
}
