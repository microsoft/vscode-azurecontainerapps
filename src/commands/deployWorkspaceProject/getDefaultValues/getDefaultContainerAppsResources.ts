/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { fullRelativeSettingsFilePath } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { IDeployWorkspaceProjectSettings } from "../getContainerAppDeployWorkspaceSettings";
import { getMostUsedManagedEnvironmentResources } from "./getMostUsedManagedEnvironmentResources";

interface DefaultContainerAppsResources {
    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    containerApp?: ContainerAppModel;
}

export async function getDefaultContainerAppsResources(context: ISubscriptionActionContext, settings: IDeployWorkspaceProjectSettings | undefined): Promise<DefaultContainerAppsResources> {
    // For testing creation of resources
    // const resourceGroup = undefined;
    // const managedEnvironment = undefined;
    // const containerApp = undefined;

    // Strategy 1: See if there is a local workspace configuration to leverage
    let { resourceGroup, managedEnvironment, containerApp } = await getContainerAppWorkspaceSettingResources(context, settings);
    if (containerApp) {
        return {
            resourceGroup,
            managedEnvironment,
            containerApp
        };
    }

    // Strategy 2: Try finding the most used managed environment resources (Azure CLI strategy)
    const { managedEnvironment: mostUsedManagedEnvironment, resourceGroup: mostUsedEnvironmentResourceGroup } = await getMostUsedManagedEnvironmentResources(context) ?? { managedEnvironment: undefined, resourceGroup: undefined };
    if (mostUsedManagedEnvironment) {
        resourceGroup = mostUsedEnvironmentResourceGroup;
        managedEnvironment = mostUsedManagedEnvironment;
        containerApp = undefined;
    }

    if (managedEnvironment) {
        ext.outputChannel.appendLog(localize('locatedFrequentlyUsedResources', 'Located most frequently used container app environment resources.'));
    } else {
        ext.outputChannel.appendLog(localize('noResourcesLocated', 'Unable to locate existing container app environment resources.'));
    }

    return {
        resourceGroup,
        managedEnvironment,
        containerApp,
    };
}

async function getContainerAppWorkspaceSettingResources(context: ISubscriptionActionContext, settings: IDeployWorkspaceProjectSettings | undefined): Promise<Pick<DefaultContainerAppsResources, 'resourceGroup' | 'managedEnvironment' | 'containerApp'>> {
    const noResourceMatch = {
        resourceGroup: undefined,
        managedEnvironment: undefined,
        containerApp: undefined
    };

    if (!settings) {
        // We already output a message to user about missing settings, no need to do so again
        return noResourceMatch;
    } else if (!settings.containerAppResourceGroupName || !settings.containerAppName) {
        ext.outputChannel.appendLog(localize('noResources', 'Scanned and found incomplete container app resource settings at "{0}".', fullRelativeSettingsFilePath));
        return noResourceMatch;
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
        return noResourceMatch;
    }
}
