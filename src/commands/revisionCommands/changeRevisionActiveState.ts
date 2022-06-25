/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { IActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { appFilter } from "../../constants";
import { ext } from "../../extensionVariables";
import { ContainerAppResource } from "../../resolver/ContainerAppResource";
import { ContainerAppExtTreeItem } from "../../tree/ContainerAppExtTreeItem";
import { RevisionResource } from "../../tree/RevisionResource";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";

export async function changeRevisionActiveState(context: IActionContext, command: 'activate' | 'deactivate' | 'restart',
    node?: ContainerAppExtTreeItem<ContainerAppResource | RevisionResource>): Promise<void> {
    if (!node) {
        node = await ext.rgApi.pickAppResource(context, {
            filter: appFilter,
        }) as ContainerAppExtTreeItem<ContainerAppResource>;
    }

    const containerApp = node.resource.containerApp;
    const containerAppName: string = containerApp.name;
    const revisionName: string = nonNullProp(containerApp.data, 'latestRevisionName');
    const resourceGroupName: string = containerApp.resourceGroupName;

    const appClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, containerApp.subscriptionContext]);

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
