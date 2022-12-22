/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as azUtil from '@microsoft/vscode-azext-azureutils';
import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';

export async function openInPortal(_context: IActionContext, node: AzExtTreeItem): Promise<void> {
    await azUtil.openInPortal(node, node.id ?? node.fullId);
}
