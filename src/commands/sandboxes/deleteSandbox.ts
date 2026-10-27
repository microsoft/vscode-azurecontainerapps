/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DialogResponses, createSubscriptionContext, type IActionContext } from '@microsoft/vscode-azext-utils';
import { createSandboxService } from '../../sandboxes/SandboxService';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { refreshSandboxesTree, requireSandboxItem, runSandboxActivity } from './sandboxCommandUtils';

export async function deleteSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    const service = createSandboxService([context, createSubscriptionContext(item.subscription)], item.ref);

    const deleteMessage = localize('confirmDeleteSandbox', 'Are you sure you want to delete sandbox "{0}"? This cannot be undone.', item.label);
    await context.ui.showWarningMessage(deleteMessage, { modal: true }, DialogResponses.deleteResponse);

    await runSandboxActivity(
        localize('deleteSandboxActivity', 'Delete sandbox "{0}"', item.label),
        localize('deletingSandbox', 'Deleting sandbox "{0}"...', item.label),
        async () => service.deleteSandbox(item.ref.sandboxId),
    );

    refreshSandboxesTree();
}
