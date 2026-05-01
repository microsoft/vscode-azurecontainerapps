/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { autoEsbuildOrWatch, autoSelectEsbuildConfig } from '@microsoft/vscode-azext-eng/esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const pkgDist = dirname(require.resolve('@microsoft/vscode-azext-webview/package.json')) + '/dist';
const outDir = 'dist/webview-assets';
mkdirSync(outDir, { recursive: true });
copyFileSync(join(pkgDist, 'views.js'), join(outDir, 'views.js'));
copyFileSync(join(pkgDist, 'views.css'), join(outDir, 'views.css'));

const configs = autoSelectEsbuildConfig();
await autoEsbuildOrWatch(configs);
