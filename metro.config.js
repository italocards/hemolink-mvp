// metro.config.js — Expo SDK 58
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK v10 usa package.json "exports".
// Desabilitar evita erros de resolução com Metro.
config.resolver.unstable_enablePackageExports = false;

// Forçar Metro a usar o build compilado do reanimated (lib/module)
// em vez do source (src/), evitando imports de worklets não instalados.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-worklets') {
    // Redireciona para o mock do reanimated caso worklets não esteja instalado
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
