import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  children: ReactNode;
  onRetry?: () => void;
};

type State = {
  error: Error | null;
};

export class ExploreMapErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[ExploreMap]', error.message, info.componentStack);
    }
  }

  private retry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-surface px-6">
          <Text className="text-center text-lg font-bold text-ink">Map unavailable</Text>
          <Text className="mt-3 text-center text-sm leading-5 text-gray-600">
            The explore map could not load safely. Rebuild the app after setting your Google Maps key in
            EAS, or try again.
          </Text>
          <Pressable
            onPress={this.retry}
            className="mt-6 rounded-3xl bg-primary px-8 py-3.5 shadow-md active:opacity-90">
            <Text className="font-bold text-ink">Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
