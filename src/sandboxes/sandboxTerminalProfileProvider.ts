/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { createAcaSandboxCli } from './createAcaSandboxCli';
import { pickSandbox } from './pickSandbox';
import { buildSandboxTerminalOptions } from './sandboxTerminal';

/** Profile id contributed via `contributes.terminal.profiles` in package.json. */
export const sandboxTerminalProfileId: string = 'containerApps.sandboxes.terminalProfile';

/**
 * Terminal profile provider that lets users open an ACA sandbox shell from the terminal's
 * "+" split-button menu. Reuses {@link pickSandbox} and the shared terminal options so the
 * spawned `aca sandbox shell` matches the "Open Sandbox Shell" command exactly.
 */
export const sandboxTerminalProfileProvider: vscode.TerminalProfileProvider = {
    async provideTerminalProfile(_token: vscode.CancellationToken): Promise<vscode.TerminalProfile | undefined> {
        return callWithTelemetryAndErrorHandling('containerApps.sandboxes.provideTerminalProfile', async (context: IActionContext) => {
            const cli = createAcaSandboxCli();
            const picked = await pickSandbox(context, cli);
            return new vscode.TerminalProfile(buildSandboxTerminalOptions(picked.label, picked.ref));
        });
    },
};
