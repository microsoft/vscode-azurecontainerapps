/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { openUrl, type IActionContext } from '@microsoft/vscode-azext-utils';
import { SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { createPortalUrl } from '../../utils/createPortalUrl';
import { pickSandbox } from '../../utils/pickItem/pickSandbox';

export async function openSandboxInPortal(context: IActionContext, node?: SandboxItem): Promise<void> {
    if (node && !SandboxItem.isSandboxItem(node)) {
        node = undefined;
    }
    node ??= await pickSandbox(context);

    const groupId = `/subscriptions/${node.ref.subscriptionId}/resourceGroups/${node.ref.resourceGroup}/providers/Microsoft.App/sandboxGroups/${node.ref.groupName}`;
    await openUrl(createPortalUrl(node.subscription, groupId).toString(true));
}
