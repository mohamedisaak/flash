module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource: "nativewind" lets `className` work on RN components.
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
