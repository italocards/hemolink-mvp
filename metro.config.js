// metro.config.js — Expo SDK 58 + RN 0.78
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK v10 usa package.json "exports".
config.resolver.unstable_enablePackageExports = false;

// RN 0.78 removeu react-native/asset-registry e react-native/Libraries/Image/AssetRegistry
// como entradas públicas diretas. Mapear para o caminho correto.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native/asset-registry':
    path.resolve(__dirname, 'node_modules/react-native/Libraries/Image/AssetRegistry'),
  'react-native/unstable-internals-do-not-use':
    path.resolve(__dirname, 'node_modules/react-native/Libraries/ReactNative/ReactFabric'),
};

// Interceptar worklets e módulos inexistentes
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-worklets') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/react-native-reanimated/mock.js'
      ),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
