/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { localize } from '../utils/localize';
import { type Sandbox, type SandboxRef } from './acaSandboxTypes';
import { resolveAcaPath } from './createAcaSandboxCli';

/**
 * Builds the `aca sandbox shell` argument vector that opens an interactive shell into a
 * sandbox microVM. Shared by the "Open Sandbox Shell" command and the terminal profile
 * provider so both spawn the CLI identically.
 */
export function buildSandboxShellArgs(ref: SandboxRef): string[] {
    return ['sandbox', 'shell', '-s', ref.subscriptionId, '-g', ref.resourceGroup, '--group', ref.groupName, '--id', ref.sandboxId];
}

/**
 * Builds the {@link vscode.TerminalOptions} used to launch an interactive sandbox shell.
 * Uses the resolved `aca` executable as the terminal's `shellPath` so VS Code owns the PTY;
 * no custom pseudoterminal or native dependency is required.
 */
export function buildSandboxTerminalOptions(label: string, ref: SandboxRef): vscode.TerminalOptions {
    return {
        name: localize('sandboxTerminalName', 'Sandbox: {0}', label),
        shellPath: resolveAcaPath(),
        shellArgs: buildSandboxShellArgs(ref),
        iconPath: new vscode.ThemeIcon('terminal'),
    };
}

/** Creates and reveals an interactive terminal connected to the given sandbox. */
export function openSandboxTerminal(label: string, ref: SandboxRef): vscode.Terminal {
    const terminal = vscode.window.createTerminal(buildSandboxTerminalOptions(label, ref));
    terminal.show();
    return terminal;
}

/** Derives a friendly display label for a sandbox from its labels, falling back to a short id. */
export function sandboxDisplayLabel(sandbox: Sandbox): string {
    const labels = sandbox.labels ?? {};
    return labels.name || labels.displayName || (sandbox.id ? sandbox.id.split('-')[0] : localize('sandbox', 'Sandbox'));
}
