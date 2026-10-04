module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4: o plugin foi movido para react-native-worklets
    // e babel-preset-expo gerencia isso automaticamente — não precisa declarar aqui.
  };
};
