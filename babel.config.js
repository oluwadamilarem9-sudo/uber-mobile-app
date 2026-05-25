module.exports = function (api) {
  api.cache(true);
  const plugins = [
    './babel-plugin-inject-app-font-class.cjs',
    'react-native-reanimated/plugin',
  ];
  /** Avoid `api.env()` here — it reconfigures Babel cache and conflicts with `api.cache(true)`. */
  if (process.env.NODE_ENV === 'production') {
    plugins.unshift('transform-remove-console');
  }
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
