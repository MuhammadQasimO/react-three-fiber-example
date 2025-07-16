const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {getDefaultConfig: getExpoDefaultConfig} = require('expo/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

// Get both React Native and Expo default configs
const defaultConfig = getDefaultConfig(__dirname);
const expoConfig = getExpoDefaultConfig(__dirname);

const config = {
  resolver: {
    assetExts: [
      ...defaultConfig.resolver.assetExts,
      // 3D model formats
      'obj',
      'mtl',
      'glb',
      'gltf',
      'fbx',
      'dae',
      '3ds',
      // Other
      'bin',
      'hdr',
    ],
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs', 'mjs'],
  },
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
};

module.exports = mergeConfig(expoConfig, config);
