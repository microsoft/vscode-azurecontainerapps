/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AcaSandboxCli } from './AcaSandboxCli';
import { resolveExecutable } from './cliPath';

/** Configuration key for the path to the `aca` executable. */
export const acaPathSettingKey: string = 'containerApps.sandboxes.acaPath';

/**
 * Resolves the `aca` executable to an absolute path, honoring the
 * `containerApps.sandboxes.acaPath` setting and otherwise searching common install locations
 * (a GUI-launched VS Code does not inherit the shell PATH). Falls back to the bare `aca`
 * (`aca.exe` on Windows) name when it cannot be located. Useful for callers that spawn `aca`
 * directly (e.g. the integrated sandbox terminal's `shellPath`).
 */
export function resolveAcaPath(): string {
    const configured = vscode.workspace.getConfiguration().get<string>(acaPathSettingKey)?.trim();
    if (configured) {
        return configured;
    }
    return resolveExecutable(process.platform === 'win32' ? 'aca.exe' : 'aca');
}

/**
 * Creates an {@link AcaSandboxCli} honoring the `containerApps.sandboxes.acaPath` setting.
 * An empty setting falls back to searching the PATH.
 */
export function createAcaSandboxCli(): AcaSandboxCli {
    const acaPath = vscode.workspace.getConfiguration().get<string>(acaPathSettingKey)?.trim() || undefined;
    return new AcaSandboxCli({ acaPath });
}
