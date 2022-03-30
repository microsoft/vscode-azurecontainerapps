/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as azUtil from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../extensionVariables';
import { ContainerAppTreeItem } from '../tree/ContainerAppTreeItem';
import { ManagedEnvironmentTreeItem } from '../tree/ManagedEnvironmentTreeItem';

export async function openInPortal(context: IActionContext, node?: AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ManagedEnvironmentTreeItem>(ManagedEnvironmentTreeItem.contextValue, context);
    }

    if (node instanceof ContainerAppTreeItem) {
        // ContainerApp's id don't include the ManagedEnvironment (ie the parent) so don't use fullId
        await azUtil.openInPortal(node, <string>node.data.id);
    } else {
        await azUtil.openInPortal(node, node.fullId);
    }


}
