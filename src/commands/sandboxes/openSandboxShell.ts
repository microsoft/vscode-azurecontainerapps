/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { openSandboxTerminal, promptForAcaExecutable } from '../../sandboxes/sandboxTerminal';
import { pickSandbox } from '../../utils/pickItem/pickSandbox';
import { refreshSandboxesTree } from './sandboxCommandUtils';

const resumeRefreshIntervalMs: number = 5 * 1000;
const resumeRefreshMaxAttempts: number = 12;

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
        const terminal = openSandboxTerminal(node.label, node.ref, executable);
        watchSandboxStateChanges(terminal);
    }
}

/**
 * The CLI may resume a stopped sandbox after the terminal opens, so briefly refresh the tree
 * until the terminal closes to pick up the new state.
 */
function watchSandboxStateChanges(terminal: vscode.Terminal): void {
    let attempts = 0;
    const stop = (): void => {
        clearInterval(timer);
        closeListener.dispose();
    };
    const timer = setInterval(() => {
        refreshSandboxesTree();
        if (++attempts >= resumeRefreshMaxAttempts) {
            stop();
        }
    }, resumeRefreshIntervalMs);
    const closeListener = vscode.window.onDidCloseTerminal(closed => {
        if (closed === terminal) {
            stop();
            refreshSandboxesTree();
        }
    });
}
