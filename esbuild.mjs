/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { autoEsbuildOrWatch, autoSelectEsbuildConfig } from '@microsoft/vscode-azext-eng/esbuild';

const configs = autoSelectEsbuildConfig();

// Add the MCP server as an additional entry point
configs.extensionConfig = {
    ...configs.extensionConfig,
    entryPoints: [
        ...configs.extensionConfig.entryPoints,
        {
            in: './src/chat/mcpApps/scaffoldCompleteServer.ts',
            out: 'scaffoldCompleteServer',
        },
    ],
    plugins: [
        ...configs.extensionConfig.plugins,
        (await import('esbuild-plugin-copy')).copy({
            assets: [
                {
                    from: './src/chat/mcpApps/scaffoldCompleteApp.html',
                    to: '.',
                },
            ],
        }),
    ],
};

await autoEsbuildOrWatch(configs);
