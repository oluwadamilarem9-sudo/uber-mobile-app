/** @type {import('@expo/config').ExpoConfig} */
module.exports = () => {
  const base = require('./app.json');

  return {
    ...base,
    expo: {
      ...base.expo,
      extra: {
        ...base.expo.extra,
        eas: {
          projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
        },
      },
      plugins: [
        ...(base.expo.plugins ?? []),
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
            icon: './assets/images/icon.png',
            color: '#F5C400',
            sounds: [],
            androidMode: 'default',
            androidCollapsedTitle: 'Ride updates',
          },
        ],
      ],
    },
  };
};
