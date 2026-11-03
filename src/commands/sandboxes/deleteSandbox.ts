/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DialogResponses, createSubscriptionContext, type IActionContext, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import { createSandboxService } from '../../sandboxes/SandboxService';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { pickSandbox } from '../../utils/pickItem/pickSandbox';
import { refreshSandboxesTree, runSandboxActivity } from './sandboxCommandUtils';

export async function deleteSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    if (node && !SandboxItem.isSandboxItem(node)) {
        node = undefined;
    }
    node ??= await pickSandbox(context);

    const subscriptionContext: IActionContext & ISubscriptionContext & { subscription: AzureSubscription } = Object.assign(context, {
        ...createSubscriptionContext(node.subscription),
        subscription: node.subscription,
    });
    const service = createSandboxService(subscriptionContext, node.ref);

    const deleteMessage = localize('confirmDeleteSandbox', 'Are you sure you want to delete sandbox "{0}"? This cannot be undone.', node.label);
    await context.ui.showWarningMessage(deleteMessage, { modal: true }, DialogResponses.deleteResponse);

    await runSandboxActivity(
        localize('deleteSandboxActivity', 'Delete sandbox "{0}"', node.label),
        localize('deletingSandbox', 'Deleting sandbox "{0}"...', node.label),
        async () => service.deleteSandbox(node.ref.sandboxId),
    );

    refreshSandboxesTree();
}
