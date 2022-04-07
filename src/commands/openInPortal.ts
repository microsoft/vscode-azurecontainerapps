/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as azUtil from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../extensionVariables';
import { ManagedEnvironmentTreeItem } from '../tree/ManagedEnvironmentTreeItem';

export async function openInPortal(context: IActionContext, node?: AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ManagedEnvironmentTreeItem>(ManagedEnvironmentTreeItem.contextValueRegExp, context);
    }

    await azUtil.openInPortal(node, node.id ?? node.fullId);
}
