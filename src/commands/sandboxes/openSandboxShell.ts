/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { openSandboxTerminal, promptForAcaExecutable } from '../../sandboxes/sandboxTerminal';
import { requireSandboxItem } from './sandboxCommandUtils';

/**
 * Opens a real interactive shell through `aca sandbox shell`. All non-terminal sandbox
 * operations use the SDK; the CLI remains necessary only because the SDK has no streaming shell.
 */
export async function openSandboxShell(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    const executable = await promptForAcaExecutable(context);
    if (executable) {
        openSandboxTerminal(item.label, item.ref, executable);
    }
}
