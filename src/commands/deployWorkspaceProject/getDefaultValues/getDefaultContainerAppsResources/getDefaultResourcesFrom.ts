/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import type { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../../tree/ManagedEnvironmentItem";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import type { DeployWorkspaceProjectSettings } from "../../deployWorkspaceProjectSettings";
import type { DefaultContainerAppsResources } from "./getDefaultContainerAppsResources";
import { getResourcesFromContainerAppHelper, getResourcesFromManagedEnvironmentHelper } from "./getResourceHelpers";

const noMatchingResources = {
    resourceGroup: undefined,
    managedEnvironment: undefined,
    containerApp: undefined
};

export async function getContainerAppResourcesFromSettings(context: ISubscriptionActionContext, settings: DeployWorkspaceProjectSettings | undefined): Promise<DefaultContainerAppsResources> {
    if (!settings || !settings.containerAppResourceGroupName || !settings.containerAppName) {
        return noMatchingResources;
    }

    const resourceGroupName: string = settings.containerAppResourceGroupName;
    const containerAppName: string = settings.containerAppName;

    try {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const containerApp: ContainerApp = await client.containerApps.get(resourceGroupName, containerAppName);
        const containerAppModel: ContainerAppModel = ContainerAppItem.CreateContainerAppModel(containerApp);

        const resources: DefaultContainerAppsResources = await getResourcesFromContainerAppHelper(context, containerAppModel);
        ext.outputChannel.appendLog(localize('foundResourceMatch', 'Used saved workspace settings and found existing container app resources.'));

        return resources;
    } catch {
        ext.outputChannel.appendLog(localize('noResourceMatch', 'Used saved workspace settings to search for container app "{0}" in resource group "{1}" but found no match.', settings.containerAppName, settings.containerAppResourceGroupName));
        return noMatchingResources;
    }
}

export async function getContainerAppResourcesFromItem(context: ISubscriptionActionContext, item: ContainerAppItem | ManagedEnvironmentItem): Promise<DefaultContainerAppsResources> {
    if (!ContainerAppItem.isContainerAppItem(item) && !ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        const incompatibleMessage: string = localize('incompatibleTreeItem', 'An incompatible Azure Container Apps tree item was provided for project deployment.');
        ext.outputChannel.appendLog(localize('incompatibleMessageLog', 'Error: {0}', incompatibleMessage));
        throw new Error(incompatibleMessage);
    }

    if (ContainerAppItem.isContainerAppItem(item)) {
        return await getResourcesFromContainerAppHelper(context, item.containerApp);
    } else {
        return await getResourcesFromManagedEnvironmentHelper(context, item.managedEnvironment);
    }
}
