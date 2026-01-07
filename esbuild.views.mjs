/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const path = require('path');
const esbuild = require('esbuild');
const copy = require('esbuild-plugin-copy');
import { getAutoBuildSettings } from '@microsoft/vscode-azext-eng/esbuild';

const { isAutoDebug, isAutoWatch } = getAutoBuildSettings()

// Todo: const outdir = path.resolve(__dirname, 'dist'); see if this is still needed below just directly put in the dist folder not sure if we need the __dirnsame before

const commonConfig = {
    entryPoints: {
        views: path.resolve(__dirname, 'src/webviews/index.tsx'),
    },

    bundle: true,
    outdir: './dist', //check if this is correct (may be diff now since we are using esbuild)
    format: 'cjs',
    platform: 'browser', //todo: remove (platform is auto browser if not specified)
    target: 'es2022',
    sourcemap: isAutoWatch,
    minify: !isAutoWatch,
    metafile: isAutoDebug,
    splitting: false,

    inject: [path.resolve(__dirname, 'react-shim.js')], //todo: gotta create this react-shim.js

    // todo: may need to check these
    loader: {
        '.ts': 'ts',
        '.tsx': 'tsx',
        '.css': 'css',
        '.scss': 'css',
        '.sass': 'css',
        '.ttf': 'file',
    },

    plugins: [
        // todo do we need this? Added since esbuild does not support sass so we need to add the plugin but not sure if sass is needed
        {
            name: 'sass',
            setup(build) {
                const sass = require('sass');
                build.onLoad({ filter: /\.s[ac]ss$/ }, async (args) => {
                    const result = sass.renderSync({ file: args.path });
                    return {
                        contents: result.css.toString(),
                        loader: 'css',
                    };
                });
            },
        },

        // todo: make sure these file paths are still correct. They may be different now with using esbuild
        copy({
            assets: {
                from: [
                    path.resolve(__dirname, 'node_modules/@vscode/codicons/dist/codicon.css'),
                    path.resolve(__dirname, 'node_modules/@vscode/codicons/dist/codicon.ttf'),
                ],
                to: [
                    path.resolve(outdir, 'icons/codicon.css'),
                    path.resolve(outdir, 'icons/codicon.ttf'),
                ],
            },
        }),
    ],

    logLevel: 'info'
};

if (isAutoWatch) {
    esbuild
        .serve(
            {
                servedir: outdir, // todo esbuild only serves one directory so in order to copy the static then we would need to copy over into dist/static (this is done in webpack)
                port: 8080,
                host: '127.0.0.1',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    'Access-Control-Allow-Headers':
                        'X-Requested-With, content-type, Authorization',
                },
            },
            {
                ...commonConfig,
                publicPath: '/',
            }
        )
        .then(() => {
            console.log('Dev server running at http://127.0.0.1:8080');
        })
        .catch(() => process.exit(1));
} else {
    esbuild.build(commonConfig).catch(() => process.exit(1));
}
