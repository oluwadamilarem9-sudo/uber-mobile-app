/** @type {import('@expo/config').ExpoConfig} */
module.exports = () => {
  const base = require('./app.json');
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return {
    ...base,
    expo: {
      ...base.expo,
      ios: {
        ...base.expo.ios,
        config: {
          ...base.expo.ios?.config,
          googleMapsApiKey,
        },
      },
      android: {
        ...base.expo.android,
        config: {
          ...base.expo.android?.config,
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        },
      },
      extra: {
        ...base.expo.extra,
        eas: {
          projectId:
            process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? 'e10ba164-a739-4144-9945-31aa12e8c59a',
        },
      },
      plugins: [
        ...(base.expo.plugins ?? []),
        'expo-web-browser',
        [
          'expo-image-picker',
          {
            photosPermission: 'Allow $(PRODUCT_NAME) to choose a profile photo from your library.',
            cameraPermission: 'Allow $(PRODUCT_NAME) to take a profile photo.',
          },
        ],
        [
          'expo-location',
          {
            locationWhenInUsePermission:
              'Allow $(PRODUCT_NAME) to use your location to show you on the map and build routes.',
          },
        ],
        [
          'expo-notifications',
          {
            icon: './assets/icon.png',
            color: '#FFD000',
            sounds: [],
            androidMode: 'default',
            androidCollapsedTitle: 'Ride updates',
          },
        ],
      ],
    },
  };
};
