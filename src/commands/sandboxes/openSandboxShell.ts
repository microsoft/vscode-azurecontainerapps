/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { openSandboxTerminal, promptForAcaExecutable } from '../../sandboxes/sandboxTerminal';
import { pickSandbox } from '../../utils/pickItem/pickSandbox';

/**
 * Opens a real interactive shell through `aca sandbox shell`. All non-terminal sandbox
 * operations use the SDK; the CLI remains necessary only because the SDK has no streaming shell.
 */
export async function openSandboxShell(context: IActionContext, node?: SandboxItem): Promise<void> {
    if (node && !SandboxItem.isSandboxItem(node)) {
        node = undefined;
    }
    node ??= await pickSandbox(context);

    const executable = await promptForAcaExecutable(context);
    if (executable) {
        openSandboxTerminal(node.label, node.ref, executable);
    }
}
