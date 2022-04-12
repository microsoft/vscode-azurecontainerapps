/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from '@azure/arm-app';
import { IActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppTreeItem } from '../../tree/ContainerAppTreeItem';
import { RevisionTreeItem } from "../../tree/RevisionTreeItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";

export async function changeRevisionActiveState(context: IActionContext, command: 'activate' | 'deactivate' | 'restart', node?: ContainerAppTreeItem | RevisionTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<ContainerAppTreeItem | RevisionTreeItem>(ContainerAppTreeItem.contextValue, context);
    }

    const containerAppName: string = node instanceof RevisionTreeItem ? node.parent.parent.name : node.name;
    const revisionName: string = node instanceof RevisionTreeItem ? node.name : nonNullProp(node.data, 'latestRevisionName');
    const resourceGroupName: string = node instanceof RevisionTreeItem ? node.parent.parent.resourceGroupName : node.resourceGroupName;

    const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, node]);

    const temporaryDescriptions = {
        'activate': localize('activating', 'Activating...'),
        'deactivate': localize('deactivating', 'Deactivating...'),
        'restart': localize('restarting', 'Restarting...'),
    }
    await node.runWithTemporaryDescription(context, temporaryDescriptions[command], async () => {
        switch (command) {
            case 'activate':
                await appClient.containerAppsRevisions.activateRevision(resourceGroupName, containerAppName, revisionName);
                break;
            case 'deactivate':
                await appClient.containerAppsRevisions.deactivateRevision(resourceGroupName, containerAppName, revisionName);
                break;
            case 'restart':
                await appClient.containerAppsRevisions.restartRevision(resourceGroupName, containerAppName, revisionName);
                break;
        }
    });

    await node.refresh(context);
}
