/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecuteActivity } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { ext } from '../../extensionVariables';
import { getSandboxGroupResourceId, getSandboxResourceId, type SandboxRef } from '../../sandboxes/sandboxTypes';
import { createActivityContext } from '../../utils/activityUtils';
import { localize } from '../../utils/localize';

/** Refreshes the sandbox group branch in the Azure Resources view after a mutation. */
export function refreshSandboxesTree(): void {
    ext.sandboxGroupBranchDataProvider?.refresh();
}

/** Refreshes both Azure resource views after creating or deleting a sandbox group. */
export async function refreshSandboxGroups(): Promise<void> {
    refreshSandboxesTree();
    await Promise.all([
        vscode.commands.executeCommand('azureResourceGroups.refreshTree'),
        vscode.commands.executeCommand('azureFocusView.refreshTree'),
    ]);
}

/** Expands the sandbox group and selects a sandbox in the Azure Resources view. */
export async function revealSandbox(ref: SandboxRef): Promise<void> {
    await vscode.commands.executeCommand('azureResourceGroups.focus');
    await ext.rgApiV2.resources.revealAzureResource(getSandboxGroupResourceId(ref), {
        select: false,
        focus: true,
        expand: true,
    });
    await ext.rgApiV2.resources.revealAzureResource(getSandboxResourceId(ref), {
        select: true,
        focus: true,
    });
}

/** Runs a sandbox operation with both an Azure Activity entry and a progress notification. */
export async function runSandboxActivity(activityTitle: string, progressTitle: string, task: () => Promise<void>): Promise<void> {
    const activityContext = {
        ...await createActivityContext(),
        activityTitle,
    };
    const activity = new ExecuteActivity(activityContext, async () => {
        ext.outputChannel.appendLog(progressTitle);
        try {
            await runWithProgress();
        } catch (error) {
            ext.outputChannel.appendLog(localize('sandboxActivityFailed', 'Failed: {0}', activityTitle));
            throw error;
        }
        ext.outputChannel.appendLog(localize('sandboxActivitySucceeded', 'Completed: {0}', activityTitle));
    });

    await activityContext.registerActivity(activity);
    await activity.run();

    async function runWithProgress(): Promise<void> {
        if (activityContext.suppressNotification) {
            await task();
        } else {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: progressTitle,
            }, task);
        }
    }
}
