/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { openUrl, type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { localize } from '../utils/localize';
import { augmentedPath, resolveExecutable, type ExecutableCheck } from './cliPath';
import { type Sandbox, type SandboxRef } from './sandboxTypes';

/** Configuration key for the ACA executable used only by the interactive terminal. */
export const acaTerminalPathSettingKey: string = 'containerApps.sandboxes.acaPath';
const defaultAcaExecutable: string = process.platform === 'win32' ? 'aca.exe' : 'aca';
const platformName: string = process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux';
const acaCliInstallUrl: string = 'https://github.com/microsoft/azure-container-apps/blob/main/aca-cli/preview/README.md#install';

export function resolveAcaExecutable(
    configuredPath?: string,
    searchDirs?: readonly string[],
    executableCheck?: ExecutableCheck,
): string | undefined {
    return resolveExecutable(configuredPath?.trim() || defaultAcaExecutable, searchDirs, executableCheck);
}

export async function promptForAcaExecutable(context: IActionContext): Promise<string | undefined> {
    const configuredPath = vscode.workspace.getConfiguration().get<string>(acaTerminalPathSettingKey)?.trim();
    const executable = resolveAcaExecutable(configuredPath);
    if (executable) {
        return executable;
    }

    const install: vscode.MessageItem = { title: localize('install', 'Install') };
    const configurePath: vscode.MessageItem = { title: localize('configurePath', 'Configure Path') };
    const result = await context.ui.showWarningMessage(
        localize(
            'acaCliNotFound',
            'The ACA CLI executable "{0}" was not found. Install the ACA CLI for {1}, or configure "{2}" with the full executable path.',
            configuredPath || defaultAcaExecutable,
            platformName,
            acaTerminalPathSettingKey,
        ),
        { modal: true },
        install,
        configurePath,
    );

    if (result === install) {
        await openUrl(acaCliInstallUrl);
    } else if (result === configurePath) {
        await vscode.commands.executeCommand('workbench.action.openSettings', acaTerminalPathSettingKey);
    }
    return undefined;
}

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

export function createSandboxTerminalOptions(label: string, ref: SandboxRef, executable: string): vscode.TerminalOptions {
    return {
        name: localize('sandboxTerminalName', 'Sandbox: {0}', label),
        shellPath: executable,
        shellArgs: buildSandboxShellArgs(ref),
        iconPath: new vscode.ThemeIcon('terminal'),
        env: {
            PATH: augmentedPath(),
        },
    };
}

/** Creates a real interactive terminal using `aca sandbox shell`. */
export function openSandboxTerminal(label: string, ref: SandboxRef, executable: string): vscode.Terminal {
    const terminal = vscode.window.createTerminal(createSandboxTerminalOptions(label, ref, executable));
    terminal.show();
    return terminal;
}

/** Derives a friendly display label for a sandbox from its labels, falling back to a short id. */
export function sandboxDisplayLabel(sandbox: Sandbox): string {
    const labels = sandbox.labels ?? {};
    return labels.name || labels.displayName || (sandbox.id ? sandbox.id.split('-')[0] : localize('sandbox', 'Sandbox'));
}
