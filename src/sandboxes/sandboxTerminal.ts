/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { localize } from '../utils/localize';
import { augmentedPath, resolveExecutable } from './cliPath';
import { type Sandbox, type SandboxRef } from './sandboxTypes';

/** Configuration key for the ACA executable used only by the interactive terminal. */
export const acaTerminalPathSettingKey: string = 'containerApps.sandboxes.acaPath';

export function buildSandboxShellArgs(ref: SandboxRef): string[] {
    return [
        'sandbox',
        'shell',
        '-s',
        ref.subscriptionId,
        '-g',
        ref.resourceGroup,
        '--group',
        ref.groupName,
        '--region',
        ref.region,
        '--id',
        ref.sandboxId,
    ];
}

export function createSandboxTerminalOptions(label: string, ref: SandboxRef): vscode.TerminalOptions {
    const configuredPath = vscode.workspace.getConfiguration().get<string>(acaTerminalPathSettingKey)?.trim();
    return {
        name: localize('sandboxTerminalName', 'Sandbox: {0}', label),
        shellPath: configuredPath || resolveExecutable(process.platform === 'win32' ? 'aca.exe' : 'aca'),
        shellArgs: buildSandboxShellArgs(ref),
        iconPath: new vscode.ThemeIcon('terminal'),
        env: {
            PATH: augmentedPath(),
        },
    };
}

/** Creates a real interactive terminal using `aca sandbox shell`. */
export function openSandboxTerminal(label: string, ref: SandboxRef): vscode.Terminal {
    const terminal = vscode.window.createTerminal(createSandboxTerminalOptions(label, ref));
    terminal.show();
    return terminal;
}

/** Derives a friendly display label for a sandbox from its labels, falling back to a short id. */
export function sandboxDisplayLabel(sandbox: Sandbox): string {
    const labels = sandbox.labels ?? {};
    return labels.name || labels.displayName || (sandbox.id ? sandbox.id.split('-')[0] : localize('sandbox', 'Sandbox'));
}
