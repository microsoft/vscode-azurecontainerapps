/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as azUtil from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { rootFilter } from '../constants';
import { ext } from '../extensionVariables';
import { LogsTreeItem } from '../tree/LogsTreeItem';

export async function openLogsInPortal(context: IActionContext, node?: AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<AzExtTreeItem>(context, {
            filter: rootFilter,
            expectedChildContextValue: new RegExp(LogsTreeItem.openLogsContext)
        });
    }
    await azUtil.openInPortal(node, node.id ?? node.fullId);
}
