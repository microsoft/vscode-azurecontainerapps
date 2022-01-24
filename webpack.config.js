/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

//@ts-check

// See https://github.com/Microsoft/vscode-azuretools/wiki/webpack for guidance

const process = require('process');
const dev = require("vscode-azureextensiondev");

let DEBUG_WEBPACK = !/^(false|0)?$/i.test(process.env.DEBUG_WEBPACK || '');

let config = dev.getDefaultWebpackConfig({
    projectRoot: __dirname,
    verbosity: DEBUG_WEBPACK ? 'debug' : 'normal',
    loaderRules: [
        { test: /\.node$/, loader: 'node-loader', }
    ]
});

if (DEBUG_WEBPACK) {
    console.log('Config:', config);
}

module.exports = config;
