/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { createSandboxService } from '../../sandboxes/SandboxService';
import { updateAutoSuspendPolicy } from '../../sandboxes/lifecyclePolicy';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { pickSandbox } from '../../utils/pickItem/pickSandbox';
import { refreshSandboxesTree, runSandboxActivity } from './sandboxCommandUtils';

export async function setAutoSuspend(context: IActionContext, node?: SandboxItem): Promise<void> {
    if (node && !SandboxItem.isSandboxItem(node)) {
        node = undefined;
    }
    node ??= await pickSandbox(context);

    const subscriptionContext: IActionContext & ISubscriptionContext & { subscription: AzureSubscription } = Object.assign(context, {
        ...createSubscriptionContext(node.subscription),
        subscription: node.subscription,
    });
    const service = createSandboxService(subscriptionContext, node.ref);

    const picks: (vscode.QuickPickItem & { seconds?: number })[] = [
        { label: localize('autoSuspend1m', '1 minute'), seconds: 60 },
        { label: localize('autoSuspend2m', '2 minutes'), seconds: 120 },
        { label: localize('autoSuspend5m', '5 minutes'), seconds: 300 },
        { label: localize('autoSuspend10m', '10 minutes'), seconds: 600 },
        { label: localize('autoSuspend30m', '30 minutes'), seconds: 1800 },
        { label: localize('autoSuspend60m', '60 minutes'), seconds: 3600 },
        { label: localize('autoSuspendDisable', 'Disable auto-suspend') }
    ];

    const pick = await context.ui.showQuickPick(picks, {
        placeHolder: localize('autoSuspendPlaceholder', 'Select an idle timeout before the sandbox is auto-suspended'),
    });

    await runSandboxActivity(
        localize('updateAutoSuspendActivity', 'Update auto-suspend for sandbox "{0}"', node.label),
        localize('updatingAutoSuspend', 'Updating auto-suspend for sandbox "{0}"...', node.label),
        async () => {
            const sandbox = await service.getSandbox(node.ref.sandboxId);
            await service.setLifecyclePolicy(node.ref.sandboxId, updateAutoSuspendPolicy(sandbox.lifecycle, {
                enabled: pick.seconds !== undefined,
                interval: pick.seconds,
            }));
        },
    );

    refreshSandboxesTree();
}
