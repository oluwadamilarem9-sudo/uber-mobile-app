import 'firebase/auth';

declare module 'firebase/auth' {
  /** AsyncStorage-backed persistence for React Native (runtime export; types vary by SDK version). */
  export function getReactNativePersistence(
    storage: import('@react-native-async-storage/async-storage').default,
  ): import('@firebase/auth').Persistence;
}
