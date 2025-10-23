module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      }
    ],
    [
      'module-resolver',
      {
        alias: {
          crypto: 'react-native-get-random-values',
        },
      },
    ],
  ],
};