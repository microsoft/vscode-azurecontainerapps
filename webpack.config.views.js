/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* eslint-env node */

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, { mode }) => {
    const isDev = mode === 'development';

    return {
        // stats: 'detailed',
        target: 'web',
        mode: mode || 'none',
        entry: {
            views: './src/webviews/index.tsx',
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/',
            filename: '[name].js',
            libraryTarget: 'module',
        },
        experiments: {
            outputModule: true,
        },
        resolve: {
            roots: [__dirname],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        module: {
            rules: [
                {
                    test: /\.(tsx?)?$/iu,
                    use: {
                        loader: 'swc-loader',
                        options: {
                            module: {
                                type: 'es6',
                            },
                            isModule: true,
                            sourceMaps: isDev,
                            jsc: {
                                keepClassNames: true,
                                target: 'es2018',
                                parser: {
                                    syntax: 'typescript',
                                    tsx: true,
                                },
                            },
                        },
                    },
                    exclude: /node_modules/u,
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        // Creates `style` nodes from JS strings
                        'style-loader',
                        // Translates CSS into CommonJS
                        'css-loader',
                        // Compiles Sass to CSS
                        'sass-loader',
                    ],
                },
                {
                    test: /\.ttf$/,
                    type: 'asset/resource',
                },
            ],
        },
        devServer: {
            static: {
                directory: path.join(__dirname, 'src/webviews/static'),
                publicPath: '/static',
            },
            allowedHosts: 'all',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
            },
            hot: true,
            host: '127.0.0.1',
            client: {
                overlay: true,
            },
            compress: true,
            port: 8080,
            webSocketServer: 'ws',
        },
        plugins: [
            new webpack.ProvidePlugin({ React: 'react' }),
            isDev && new webpack.HotModuleReplacementPlugin(),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, 'node_modules/@vscode/codicons/dist/codicon.css'),
                        to: path.resolve(__dirname, 'dist/icons/codicon.css'),
                    },
                    {
                        from: path.resolve(__dirname, 'node_modules/@vscode/codicons/dist/codicon.ttf'),
                        to: path.resolve(__dirname, 'dist/icons/codicon.ttf'),
                    },
                ]
            }),
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
        ],
        devtool: isDev ? 'source-map' : false,
        infrastructureLogging: {
            level: 'log', // enables logging required for problem matchers
        },
    };
};
