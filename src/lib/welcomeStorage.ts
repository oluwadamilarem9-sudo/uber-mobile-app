import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@otterride_welcome_completed';

export async function markWelcomeCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function hasWelcomeCompleted(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === 'true';
}
