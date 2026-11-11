// metro.config.js — Expo SDK 57 + Firebase JS SDK v10
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK v10 usa package.json "exports".
// Desabilitar evita erros de resolução com Metro no RN 0.86+.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
