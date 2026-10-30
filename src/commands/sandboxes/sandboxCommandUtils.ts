/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecuteActivity } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { ext } from '../../extensionVariables';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { type SandboxGroupResourceItem } from '../../sandboxes/tree/SandboxGroupResourceItem';
import { createActivityContext } from '../../utils/activityUtils';
import { localize } from '../../utils/localize';

/**
 * Resolves the {@link SandboxItem} a command should act on. The per-sandbox commands are only
 * surfaced from the tree's context menu (hidden from the command palette), so the node is
 * expected to be supplied by VS Code.
 */
export function requireSandboxItem(node: SandboxItem | undefined): SandboxItem {
    if (!node) {
        throw new Error(localize('selectSandbox', 'Select a sandbox in the Azure Resources view to run this command.'));
    }
    return node;
}

/**
 * Resolves the {@link SandboxGroupResourceItem} a group-level command should act on. Group
 * commands are only surfaced from the group's context menu, so the node is supplied by VS Code.
 */
export function requireSandboxGroupItem(node: SandboxGroupResourceItem | undefined): SandboxGroupResourceItem {
    if (!node) {
        throw new Error(localize('selectSandboxGroup', 'Select a sandbox group in the Azure Resources view to run this command.'));
    }
    return node;
}

/** Refreshes the sandbox group branch in the Azure Resources view after a mutation. */
export function refreshSandboxesTree(): void {
    ext.sandboxGroupBranchDataProvider?.refresh();
}

/** Runs a sandbox operation with both an Azure Activity entry and a progress notification. */
export async function runSandboxActivity(activityTitle: string, progressTitle: string, task: () => Promise<void>): Promise<void> {
    const activityContext = {
        ...await createActivityContext(),
        activityTitle,
    };
    const activity = new ExecuteActivity(activityContext, async () => {
        if (activityContext.suppressNotification) {
            await task();
        } else {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: progressTitle,
            }, task);
        }
    });

    await activityContext.registerActivity(activity);
    await activity.run();
}
