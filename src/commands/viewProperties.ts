/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, openReadOnlyJson } from '@microsoft/vscode-azext-utils';
import { ext } from '../extensionVariables';
import { ContainerAppTreeItem } from '../tree/ContainerAppTreeItem';
import { IAzureResourceTreeItem } from '../tree/IAzureResourceTreeItem';
import { ManagedEnvironmentTreeItem } from '../tree/ManagedEnvironmentTreeItem';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';

export async function viewProperties(context: IActionContext, node?: IAzureResourceTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ManagedEnvironmentTreeItem>(ContainerAppTreeItem.contextValueRegExp, context);
    }

    if (!node.data) {
        if (node.getDataImpl) {
            await node.getDataImpl();
        } else {
            throw new Error(localize('No data exists on resource "{0}"', node.label));
        }
    }

    await openReadOnlyJson(node, nonNullProp(node, 'data'));
}
