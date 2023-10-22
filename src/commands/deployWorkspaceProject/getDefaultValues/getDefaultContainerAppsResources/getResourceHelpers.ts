/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import type { ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import type { ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import type { DefaultContainerAppsResources } from "./getDefaultContainerAppsResources";

export async function getResourcesFromContainerAppHelper(context: ISubscriptionActionContext, containerApp: ContainerAppModel): Promise<DefaultContainerAppsResources> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    const managedEnvironment = managedEnvironments.find(env => env.id === containerApp.managedEnvironmentId);
    context.telemetry.properties.managedEnvironmentCount = String(managedEnvironments.length);

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    const resourceGroup = resourceGroups.find(rg => rg.name === containerApp.resourceGroup);

    return {
        resourceGroup,
        managedEnvironment,
        containerApp
    };
}

export async function getResourcesFromManagedEnvironmentHelper(context: ISubscriptionActionContext, managedEnvironment: ManagedEnvironment): Promise<DefaultContainerAppsResources> {
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    const resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));

    return {
        resourceGroup,
        managedEnvironment,
        containerApp: undefined
    };
}
