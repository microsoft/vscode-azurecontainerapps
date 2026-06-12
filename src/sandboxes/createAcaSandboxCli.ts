/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AcaSandboxCli } from './AcaSandboxCli';

/** Configuration key for the path to the `aca` executable. */
export const acaPathSettingKey: string = 'containerApps.sandboxes.acaPath';

/**
 * Creates an {@link AcaSandboxCli} honoring the `containerApps.sandboxes.acaPath` setting.
 * An empty setting falls back to searching the PATH.
 */
export function createAcaSandboxCli(): AcaSandboxCli {
    const acaPath = vscode.workspace.getConfiguration().get<string>(acaPathSettingKey)?.trim() || undefined;
    return new AcaSandboxCli({ acaPath });
}
