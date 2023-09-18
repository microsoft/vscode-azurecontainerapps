/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { DeployWorkspaceProjectSettings } from "../deployWorkspaceProjectSettings";

interface DefaultContainerAppsResources {
    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    containerApp?: ContainerAppModel;
}

export async function getDefaultContainerAppsResources(context: ISubscriptionActionContext, settings: DeployWorkspaceProjectSettings | undefined): Promise<DefaultContainerAppsResources> {
    const noMatchingResources = {
        resourceGroup: undefined,
        managedEnvironment: undefined,
        containerApp: undefined
    };

    if (!settings || !settings.containerAppResourceGroupName || !settings.containerAppName) {
        return noMatchingResources;
    }

    const resourceGroupName: string = settings.containerAppResourceGroupName;
    const containerAppName: string = settings.containerAppName;

    try {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context)
        const containerApp: ContainerApp = await client.containerApps.get(resourceGroupName, containerAppName);
        const containerAppModel: ContainerAppModel = ContainerAppItem.CreateContainerAppModel(containerApp);

        const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
        const managedEnvironment = managedEnvironments.find(env => env.id === containerAppModel.managedEnvironmentId);

        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        const resourceGroup = resourceGroups.find(rg => rg.name === containerAppModel.resourceGroup);

        ext.outputChannel.appendLog(localize('foundResourceMatch', 'Used saved workspace settings and found existing container app resources.'));

        return {
            resourceGroup,
            managedEnvironment,
            containerApp: containerAppModel
        };
    } catch {
        ext.outputChannel.appendLog(localize('noResourceMatch', 'Used saved workspace settings to search for container app "{0}" in resource group "{1}" but found no match.', settings.containerAppName, settings.containerAppResourceGroupName));
        return noMatchingResources;
    }
}
