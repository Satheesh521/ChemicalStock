module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      
      '@babel/plugin-syntax-dynamic-import',
      // Strip webpack-specific comments to fix Metro bundler errors
      [
        function stripWebpackComments({ template }) {
          return {
            pre(file) {
              file.code = file.code
                .replace(/\/\*\s*webpackIgnore:\s*true\s*\*\//g, '')
                .replace(/\/\*\s*webpackChunkName:\s*[^*]*\*\//g, '')
                .replace(/\/\*\s*webpackMode:\s*[^*]*\*\//g, '')
                .replace(/\/\*\s*webpackPrefetch:\s*[^*]*\*\//g, '')
                .replace(/\/\*\s*webpackPreload:\s*[^*]*\*\//g, '');
            },
          };
        },
      ],
    ],
  };
};