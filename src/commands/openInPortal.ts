/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as ui from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { ContainerAppTreeItem } from '../tree/ContainerAppTreeItem';
import { KubeEnvironmentTreeItem } from '../tree/KubeEnvironmentTreeItem';

export async function openInPortal(context: ui.IActionContext, node?: ui.AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<KubeEnvironmentTreeItem>(KubeEnvironmentTreeItem.contextValue, context);
    }

    if (node instanceof ContainerAppTreeItem) {
        // ContainerApp's id don't include the KubeEnvironment (ie the parent) so don't use fullId
        await ui.openInPortal(node, <string>node.data.id);
    } else {
        await ui.openInPortal(node, node.fullId);
    }


}
