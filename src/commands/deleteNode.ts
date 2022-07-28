/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, IActionContext } from '@microsoft/vscode-azext-utils';
import { rootFilter } from '../constants';
import { ext } from '../extensionVariables';

export async function deleteNode(context: IActionContext, expectedContextValue: string | RegExp, node?: AzExtTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource({ ...context, suppressCreatePick: true }, {
            filter: rootFilter,
            expectedChildContextValue: expectedContextValue
        });
    }

    await node.deleteTreeItem(context);
}
