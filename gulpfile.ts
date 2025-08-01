/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { gulp_webpack } from '@microsoft/vscode-azext-dev';
import * as child_process from 'child_process';
import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as path from 'path';

declare let exports: { [key: string]: unknown };

async function prepareForWebpack(): Promise<void> {
    const mainJsPath: string = path.join(__dirname, 'main.js');
    let contents: string = (await fse.readFile(mainJsPath)).toString();
    contents = contents
        .replace('out/src/extension', 'dist/extension.bundle')
        .replace(', true /* ignoreBundle */', '');
    await fse.writeFile(mainJsPath, contents);
}

async function cleanReadme(): Promise<void> {
    const readmePath: string = path.join(__dirname, 'README.md');
    let data: string = (await fse.readFile(readmePath)).toString();
    data = data.replace(/<!-- region exclude-from-marketplace -->.*?<!-- endregion exclude-from-marketplace -->/gis, '');
    await fse.writeFile(readmePath, data);
}

async function installSwcCore(): Promise<void> {
    // Our pipelies run on Linux so we need to install the correct @swc/core package for te pipelines to pass.
    if (process.platform === 'linux') {
        child_process.execSync('npm install @swc/core-linux-x64-gnu --save-dev')
    }
}

exports['webpack-dev'] = gulp.series(prepareForWebpack, () => gulp_webpack('development'));
exports['webpack-prod'] = gulp.series(prepareForWebpack, () => gulp_webpack('production'));
exports.cleanReadme = cleanReadme;
exports.installSwcCore = installSwcCore;
