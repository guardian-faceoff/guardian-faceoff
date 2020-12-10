/* eslint-disable no-console */
/* eslint-disable global-require */
const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';
    const APP_DIR = path.resolve('./src');
    let bungieJson;
    if (isProd) {
        bungieJson = require('./bungie.json');
    } else {
        try {
            bungieJson = require('./bungie-dev.json');
        } catch (e) {
            console.error('Error Loading bungie-dev.json. Does this file exist?');
            process.exit(1337);
        }
    }

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
        // devServer: {
        //     contentBase: path.join(__dirname, '.'),
        //     compress: true,
        //     port: 1337,
        //     https: true,
        // },
        plugins: [
            new HtmlWebPackPlugin({
                filename: 'index.html',
                template: 'src/index.html',
                scriptLoading: 'defer',
                globalConstants: {
                    BUNGIE_APP_ID: bungieJson.BUNGIE_APP_ID,
                    BUNGIE_API_KEY: bungieJson.BUNGIE_API_KEY,
                    VERSION: '0.0.1',
                    PRODUCTION: isProd,
                },
            }),
            new webpack.DefinePlugin({
                ...bungieJson,
            }),
        ],
    };
};
