import { Link, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-center text-xl font-bold text-ink">This screen does not exist.</Text>
        <Link href="/" asChild>
          <Pressable className="mt-8 rounded-3xl bg-primary px-10 py-4 shadow-md shadow-amber-900/20 active:opacity-90">
            <Text className="text-center text-base font-bold text-ink">Go to home</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
