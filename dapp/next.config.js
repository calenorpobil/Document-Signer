module.exports = {
  webpack: (config) => {
    // @metamask/sdk bundles React Native deps that don't exist in the browser
    config.resolve.alias['@react-native-async-storage/async-storage'] = false;
    return config;
  },
};
