/* eslint-disable no-console */
/* eslint-disable global-require */
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';
    const APP_DIR = path.resolve('./src');

    return {
        mode: isProd ? 'production' : 'development',
        entry: {
            main: path.resolve(APP_DIR, 'index.js'),
        },
        output: {
            path: path.resolve(__dirname, isProd ? './public' : './dist'),
            filename: isProd ? '[name].[contenthash].js' : '[name].js',
        },
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'eslint-loader',
                },
                {
                    test: /\.(js|jsx)$/,
                    include: [path.resolve(__dirname, 'src')],
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    [
                                        '@babel/preset-env',
                                        {
                                            targets: ['last 1 version', 'ie >= 11'],
                                        },
                                    ],
                                    '@babel/preset-react',
                                ],
                                plugins: ['@babel/plugin-transform-runtime'],
                            },
                        },
                    ],
                },
            ],
        },
        devtool: 'source-map',
        plugins: [
            new HtmlWebPackPlugin({
                filename: 'index.html',
                template: 'src/index.html',
                scriptLoading: 'defer',
                globalConstants: {
                    BUNGIE_APP_ID: '34894',
                    BUNGIE_API_KEY: 'a4bb5c8feec940eeb7d8167fda39e31b',
                    VERSION: '0.0.1',
                    PRODUCTION: isProd,
                },
            }),
        ],
    };
};
