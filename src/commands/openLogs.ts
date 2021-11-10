/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, openInPortal } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { LogsTreeItem } from '../tree/LogsTreeItem';
import { nonNullProp } from '../utils/nonNull';

export async function openLogs(context: IActionContext, node?: LogsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<LogsTreeItem>(LogsTreeItem.contextValue, context);
    }

    await openInPortal(node, nonNullProp(node, 'id'));
}
