import { useState } from 'react';
import { View } from 'react-native';

import { ExploreMapErrorBoundary } from '@/components/maps/ExploreMapErrorBoundary';
import { ExploreMapScreen } from '@/components/maps/ExploreMapScreen';

export { ErrorBoundary } from 'expo-router';

export default function ExploreTabScreen() {
  const [attempt, setAttempt] = useState(0);

  return (
    <ExploreMapErrorBoundary onRetry={() => setAttempt((n) => n + 1)}>
      <View className="flex-1" key={`explore-map-${attempt}`}>
        <ExploreMapScreen />
      </View>
    </ExploreMapErrorBoundary>
  );
}
