/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecuteActivity } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { ext } from '../../extensionVariables';
import { createActivityContext } from '../../utils/activityUtils';

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
