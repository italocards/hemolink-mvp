// metro.config.js — Expo SDK 58
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK v10 usa package.json "exports".
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
