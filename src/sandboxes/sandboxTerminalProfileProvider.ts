/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { callWithTelemetryAndErrorHandling, type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { pickSandbox } from './pickSandbox';
import { createSandboxTerminalOptions } from './sandboxTerminal';

/** Profile id contributed via `contributes.terminal.profiles` in package.json. */
export const sandboxTerminalProfileId: string = 'containerApps.sandboxes.terminalProfile';

/**
 * Terminal profile provider that lets users open an SDK-backed sandbox terminal from the terminal's
 * "+" split-button menu.
 */
export const sandboxTerminalProfileProvider: vscode.TerminalProfileProvider = {
    async provideTerminalProfile(_token: vscode.CancellationToken): Promise<vscode.TerminalProfile | undefined> {
        return callWithTelemetryAndErrorHandling('containerApps.sandboxes.provideTerminalProfile', async (context: IActionContext) => {
            const picked = await pickSandbox(context);
            return new vscode.TerminalProfile(createSandboxTerminalOptions(picked.label, picked.ref));
        });
    },
};
