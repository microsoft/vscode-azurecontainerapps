/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../extensionVariables';
import { LogsTreeItem } from '../tree/LogsTreeItem';
import { openInPortal } from './openInPortal';

export async function openLogs(context: IActionContext, node?: LogsTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<LogsTreeItem>(LogsTreeItem.contextValue, context);
    }

    await openInPortal(context, node);
}
