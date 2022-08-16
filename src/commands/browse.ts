/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { rootFilter } from '../constants';
import { ext } from '../extensionVariables';
import { ContainerAppTreeItem } from '../tree/ContainerAppTreeItem';

export async function browse(context: IActionContext, node?: ContainerAppTreeItem): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource<ContainerAppTreeItem>(context, {
            filter: rootFilter,
            expectedChildContextValue: ContainerAppTreeItem.contextValueRegExp
        });
    }

    await node.browse();
}
