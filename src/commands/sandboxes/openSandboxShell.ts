/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { createSandboxService } from '../../sandboxes/SandboxService';
import { categorizeSandboxState, SandboxItem } from '../../sandboxes/tree/SandboxItem';
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
        watchSandboxStateChanges(context, node, terminal);
    }
}

/**
 * The CLI may resume a stopped sandbox after the terminal opens, so poll the sandbox state and
 * refresh the tree once when it changes, then stop watching.
 */
function watchSandboxStateChanges(context: IActionContext, node: SandboxItem, terminal: vscode.Terminal): void {
    const subscriptionContext: IActionContext & ISubscriptionContext & { subscription: AzureSubscription } = Object.assign(context, {
        ...createSubscriptionContext(node.subscription),
        subscription: node.subscription,
    });
    const service = createSandboxService(subscriptionContext, node.ref);
    const initialState = node.stateCategory;

    let attempts = 0;
    let checking = false;
    const stop = (): void => {
        clearInterval(timer);
        closeListener.dispose();
    };
    const timer = setInterval(async () => {
        if (checking) {
            return;
        }
        checking = true;
        try {
            const sandbox = await service.getSandbox(node.ref.sandboxId);
            const category = categorizeSandboxState(sandbox.state);
            if (category !== initialState) {
                refreshSandboxesTree();
                if (category !== 'transitional') {
                    stop();
                    return;
                }
            }
        } catch {
            // Best-effort polling; the next tick or terminal close will retry.
        } finally {
            checking = false;
        }
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
