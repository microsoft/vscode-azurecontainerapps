/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { openUrl, type IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { type SandboxItem } from '../../sandboxes/tree/SandboxItem';
import { createPortalUrl } from '../../utils/createPortalUrl';
import { localize } from '../../utils/localize';
import { requireSandboxItem } from './sandboxCommandUtils';

export async function copySandboxId(_context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    await vscode.env.clipboard.writeText(item.ref.sandboxId);
    void vscode.window.showInformationMessage(localize('copiedSandboxId', 'Copied sandbox ID to the clipboard.'));
}

export async function openSandboxInPortal(_context: IActionContext, node?: SandboxItem): Promise<void> {
    const item = requireSandboxItem(node);
    const groupId = `/subscriptions/${item.ref.subscriptionId}/resourceGroups/${item.ref.resourceGroup}/providers/Microsoft.App/sandboxGroups/${item.ref.groupName}`;
    await openUrl(createPortalUrl(item.subscription, groupId).toString(true));
}
