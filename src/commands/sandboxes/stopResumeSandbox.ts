/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createSubscriptionContext, type IActionContext } from '@microsoft/vscode-azext-utils';
import { createSandboxService } from '../../sandboxes/SandboxService';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { localize } from '../../utils/localize';
import { refreshSandboxesTree, requireSandboxItem, runSandboxActivity } from './sandboxCommandUtils';

export async function stopSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    const service = createSandboxService([context, createSubscriptionContext(item.subscription)], item.ref);
    await runSandboxActivity(
        localize('stopSandboxActivity', 'Stop sandbox "{0}"', item.label),
        localize('stoppingSandbox', 'Stopping sandbox "{0}"...', item.label),
        async () => {
            await service.stopSandbox(item.ref.sandboxId);
        },
    );
    refreshSandboxesTree();
}

export async function resumeSandbox(context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    const service = createSandboxService([context, createSubscriptionContext(item.subscription)], item.ref);
    await runSandboxActivity(
        localize('resumeSandboxActivity', 'Resume sandbox "{0}"', item.label),
        localize('resumingSandbox', 'Resuming sandbox "{0}"...', item.label),
        async () => {
            await service.resumeSandbox(item.ref.sandboxId);
        },
    );
    refreshSandboxesTree();
}
