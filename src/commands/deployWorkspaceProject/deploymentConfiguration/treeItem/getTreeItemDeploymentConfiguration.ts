/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { ContainerAppItem, type ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../../tree/ManagedEnvironmentItem";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { type DefaultContainerAppsResources } from "../../getDefaultValues/getDefaultContainerAppsResources/getDefaultContainerAppsResources";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";

export async function getTreeItemDeploymentConfiguration(context: IContainerAppContext, item: ContainerAppItem | ManagedEnvironmentItem): Promise<DeploymentConfiguration> {
    if (ContainerAppItem.isContainerAppItem(item)) {
        return await getResourcesFromContainerAppItem(context, item.containerApp);
    } else if (ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        return await getResourcesFromManagedEnvironmentItem(context, item.managedEnvironment);
    } else {
        const incompatibleMessage: string = localize('incompatibleTreeItem', 'An incompatible tree item was provided to Azure Container Apps for project deployment.');
        ext.outputChannel.appendLog(localize('incompatibleMessageLog', 'Error: {0}', incompatibleMessage));
        throw new Error(incompatibleMessage);
    }
}

async function getResourcesFromContainerAppItem(context: ISubscriptionActionContext, containerApp: ContainerAppModel): Promise<DefaultContainerAppsResources> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    const managedEnvironment = managedEnvironments.find(env => env.id === containerApp.managedEnvironmentId);

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    const resourceGroup = resourceGroups.find(rg => rg.name === containerApp.resourceGroup);

    return {
        resourceGroup,
        managedEnvironment,
        containerApp
    };
}

async function getResourcesFromManagedEnvironmentItem(context: ISubscriptionActionContext, managedEnvironment: ManagedEnvironment): Promise<DefaultContainerAppsResources> {
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    const resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));

    return {
        resourceGroup,
        managedEnvironment,
    };
}
