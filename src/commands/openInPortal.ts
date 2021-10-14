/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as ui from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { KubeEnvironmentTreeItem } from '../tree/KubeEnvironmentTreeItem';

export async function openInPortal(context: ui.IActionContext, node?: ui.AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<KubeEnvironmentTreeItem>(KubeEnvironmentTreeItem.contextValue, context);
    }

    await ui.openInPortal(node, node.fullId);

}
