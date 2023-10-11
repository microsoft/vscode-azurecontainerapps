/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import type { ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { nonNullProp, type IAzureQuickPickItem, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import type { DeployWorkspaceProjectSettings } from "../deployWorkspaceProjectSettings";

interface DefaultContainerAppsResources {
    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    containerApp?: ContainerAppModel;
}

const noMatchingResources = {
    resourceGroup: undefined,
    managedEnvironment: undefined,
    containerApp: undefined
};

export async function getDefaultContainerAppsResources(context: ISubscriptionActionContext, settings: DeployWorkspaceProjectSettings | undefined): Promise<DefaultContainerAppsResources> {
    // Try to obtain container app resources using any saved workspace settings
    const { resourceGroup, managedEnvironment, containerApp } = await getContainerAppResourcesFromSettings(context, settings);
    if (resourceGroup && managedEnvironment && containerApp) {
        return { resourceGroup, managedEnvironment, containerApp };
    }

    // Otherwise see if the user has any managed environment resources to leverage
    return await promptForContainerAppsEnvironmentResources(context);
}

async function getContainerAppResourcesFromSettings(context: ISubscriptionActionContext, settings: DeployWorkspaceProjectSettings | undefined): Promise<DefaultContainerAppsResources> {
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

async function promptForContainerAppsEnvironmentResources(context: ISubscriptionActionContext): Promise<DefaultContainerAppsResources> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context)
    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());

    if (!managedEnvironments.length) {
        return noMatchingResources;
    }

    const picks: IAzureQuickPickItem<ManagedEnvironment | undefined>[] = [
        {
            label: localize('newManagedEnvironment', '$(plus) Create new container apps environment'),
            description: '',
            data: undefined
        },
        ...managedEnvironments.map(env => {
            return {
                label: nonNullProp(env, 'name'),
                description: '',
                data: env
            };
        })
    ];

    const placeHolder: string = localize('selectManagedEnvironment', 'Select a container apps environment');
    const managedEnvironment: ManagedEnvironment | undefined = (await context.ui.showQuickPick(picks, { placeHolder })).data;

    if (!managedEnvironment) {
        return noMatchingResources;
    }

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    const resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));
    return { resourceGroup, managedEnvironment, containerApp: undefined };
}
