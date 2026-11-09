/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import { createSandboxService } from '../../sandboxes/SandboxService';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { pickSandbox } from '../../utils/pickItem/pickSandbox';
import { refreshSandboxesTree, runSandboxActivity } from './sandboxCommandUtils';

export async function stopSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    if (node && !SandboxItem.isSandboxItem(node)) {
        node = undefined;
    }
    node ??= await pickSandbox(context, 'running');

    const subscriptionContext: IActionContext & ISubscriptionContext & { subscription: AzureSubscription } = Object.assign(context, {
        ...createSubscriptionContext(node.subscription),
        subscription: node.subscription,
    });
    const service = createSandboxService(subscriptionContext, node.ref);
    await runSandboxActivity(
        localize('stopSandboxActivity', 'Stop sandbox "{0}"', node.label),
        localize('stoppingSandbox', 'Stopping sandbox "{0}"...', node.label),
        async () => {
            await service.stopSandbox(node.ref.sandboxId);
        },
    );
    refreshSandboxesTree();
}

export async function resumeSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    if (node && !SandboxItem.isSandboxItem(node)) {
        node = undefined;
    }
    node ??= await pickSandbox(context, 'suspended');

    const subscriptionContext: IActionContext & ISubscriptionContext & { subscription: AzureSubscription } = Object.assign(context, {
        ...createSubscriptionContext(node.subscription),
        subscription: node.subscription,
    });
    const service = createSandboxService(subscriptionContext, node.ref);
    await runSandboxActivity(
        localize('resumeSandboxActivity', 'Resume sandbox "{0}"', node.label),
        localize('resumingSandbox', 'Resuming sandbox "{0}"...', node.label),
        async () => {
            await service.resumeSandbox(node.ref.sandboxId);
        },
    );
    refreshSandboxesTree();
}
