const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Use Metro's built-in file crawler instead of Watchman. Watchman throws
// "Operation not permitted" when the project lives under a macOS-protected
// folder (~/Desktop, ~/Documents, ~/Downloads). The node crawler needs no
// extra permissions and works everywhere.
config.resolver.useWatchman = false;

module.exports = withNativeWind(config, { input: "./src/global.css" });
