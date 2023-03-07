const { ProvidePlugin } = require('webpack');

module.exports = {
    reactScriptsVersion: 'react-scripts' /* (default value) */,

    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            webpackConfig.resolve.fallback = {
                fs: false,
                buffer: require.resolve('buffer/'),
                process: false,
            };

            return webpackConfig;
        },
        plugins: [new ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: ['process'] })],
    },
};
