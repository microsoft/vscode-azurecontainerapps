/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { autoEsbuildOrWatch, autoSelectEsbuildConfig } from '@microsoft/vscode-azext-eng/esbuild';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

// Workaround for tas-client UMD/ESM mismatch:
// tas-client declares "type": "module" in package.json but its entry file is UMD
// and does `module.exports = factory()`. esbuild wraps it with __esm() (no scoped
// module/exports) instead of __commonJS(), so the UMD code overwrites the bundle's
// top-level module.exports, destroying the extension's activate/deactivate exports.
// This plugin scopes module/exports within the tas-client file to prevent the leak.
const fixTasClientPlugin = {
    name: 'fix-tas-client-umd',
    setup(build) {
        build.onLoad({ filter: /tas-client[\\/]dist[\\/]tas-client\.min\.js$/ }, (args) => {
            const contents = readFileSync(args.path, 'utf8');
            return {
                // Wrap in IIFE that provides scoped module/exports so the UMD
                // `module.exports = factory()` doesn't overwrite the bundle's exports
                contents: `(function(module, exports) {\n${contents}\n})({exports: {}}, {});\n`,
                loader: 'js',
            };
        });
    }
};

const pkgDist = dirname(require.resolve('@microsoft/vscode-azext-webview/package.json')) + '/dist';
const outDir = 'dist/webview-assets';
mkdirSync(outDir, { recursive: true });
copyFileSync(join(pkgDist, 'views.js'), join(outDir, 'views.js'));
copyFileSync(join(pkgDist, 'views.css'), join(outDir, 'views.css'));

const configs = autoSelectEsbuildConfig();
configs.extensionConfig.plugins.unshift(fixTasClientPlugin);
await autoEsbuildOrWatch(configs);
