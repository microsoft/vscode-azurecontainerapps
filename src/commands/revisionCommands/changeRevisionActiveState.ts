/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from '@azure/arm-app';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { RevisionTreeItem } from "../../tree/RevisionTreeItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullValue } from "../../utils/nonNull";

export async function changeRevisionActiveState(context: IActionContext, command: 'activate' | 'deactivate' | 'restart', node?: RevisionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<RevisionTreeItem>(RevisionTreeItem.contextValue, context);
    }

    const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, node]);

    const temporaryDescriptions = {
        'activate': localize('activating', 'Activating...'),
        'deactivate': localize('deactivating', 'Deactivating...'),
        'restart': localize('restarting', 'Restarting...'),
    }
    await node.runWithTemporaryDescription(context, temporaryDescriptions[command], async () => {
        node = nonNullValue(node);
        switch (command) {
            case 'activate':
                await appClient.containerAppsRevisions.activateRevision(node.parent.parent.resourceGroupName, node.parent.parent.name, node.name);
                break;
            case 'deactivate':
                await appClient.containerAppsRevisions.deactivateRevision(node.parent.parent.resourceGroupName, node.parent.parent.name, node.name);
                break;
            case 'restart':
                await appClient.containerAppsRevisions.restartRevision(node.parent.parent.resourceGroupName, node.parent.parent.name, node.name);
                break;
        }
    });

    await node.refresh(context);
}
