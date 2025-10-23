const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    extraNodeModules: {
      crypto: require.resolve('react-native-get-random-values'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);