/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { WorkspaceFolder } from "vscode";
import { fullRelativeSettingsFilePath } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { ContainerAppNameStep } from "../../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../../createManagedEnvironment/ManagedEnvironmentNameStep";
import { IDeployWorkspaceProjectSettings, getContainerAppDeployWorkspaceSettings } from "../getContainerAppDeployWorkspaceSettings";
import { getMostUsedManagedEnvironmentResources } from "./getMostUsedManagedEnvironmentResources";

interface DefaultContainerAppsResources {
    newResourceGroupName?: string;
    newManagedEnvironmentName?: string;
    newContainerAppName?: string;

    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    containerApp?: ContainerAppModel;
}

export async function getDefaultContainerAppsResources(context: ISubscriptionActionContext, rootFolder: WorkspaceFolder, resourceNameBase: string): Promise<DefaultContainerAppsResources> {
    resourceNameBase = resourceNameBase.toLowerCase();

    // For testing creation of resources
    // const resourceGroup = undefined;
    // const managedEnvironment = undefined;
    // const managedEnvironment = undefined;
    // const containerApp = undefined;

    // Strategy 1: See if there is a local workspace configuration to leverage
    const { resourceGroup: savedResourceGroup, managedEnvironment: savedManagedEnvironment, containerApp: savedContainerApp } = await getContainerAppWorkspaceSettingResources(context, rootFolder);
    if (savedContainerApp) {
        return {
            resourceGroup: savedResourceGroup,
            managedEnvironment: savedManagedEnvironment,
            containerApp: savedContainerApp
        };
    }

    // Strategy 2: See if we can reuse existing resources that match the workspace name
    let { resourceGroup, managedEnvironment, containerApp } = await getMatchingContainerAppsResources(context, resourceNameBase);
    if (resourceGroup || managedEnvironment || containerApp) {
        ext.outputChannel.appendLog(localize('locatedPreviousResources', 'Located existing resources matching the name of the current workspace "{0}".', resourceNameBase));

        return {
            newResourceGroupName: !resourceGroup ? resourceNameBase : undefined,
            newManagedEnvironmentName: !managedEnvironment ? resourceNameBase : undefined,
            newContainerAppName: !containerApp ? resourceNameBase : undefined,
            resourceGroup,
            managedEnvironment,
            containerApp
        };
    }

    // Strategy 3: Try finding the most used managed environment resources (Azure CLI strategy)
    const { managedEnvironment: mostUsedManagedEnvironment, resourceGroup: mostUsedEnvironmentResourceGroup } = await getMostUsedManagedEnvironmentResources(context) ?? { managedEnvironment: undefined, resourceGroup: undefined };
    if (!await isNameAvailableForContainerAppsResources(context, resourceNameBase, mostUsedEnvironmentResourceGroup, mostUsedManagedEnvironment)) {
        throw new Error(localize('resourceNameError', 'Resource names matching the current workspace "{0}" are unavailable.', resourceNameBase));
    }

    resourceGroup = mostUsedEnvironmentResourceGroup;
    managedEnvironment = mostUsedManagedEnvironment;
    containerApp = undefined;

    if (managedEnvironment) {
        ext.outputChannel.appendLog(localize('locatedFrequentlyUsedResources', 'Located most frequently used container app environment resources.'));
    } else {
        ext.outputChannel.appendLog(localize('noResourcesLocated', 'Unable to locate existing container app environment resources.'));
    }

    return {
        newResourceGroupName: !resourceGroup ? resourceNameBase : undefined,
        newManagedEnvironmentName: !managedEnvironment ? resourceNameBase : undefined,
        newContainerAppName: !containerApp ? resourceNameBase : undefined,
        resourceGroup,
        managedEnvironment,
        containerApp,
    };
}

export async function getContainerAppWorkspaceSettingResources(context: ISubscriptionActionContext, rootFolder: WorkspaceFolder): Promise<Pick<DefaultContainerAppsResources, 'resourceGroup' | 'managedEnvironment' | 'containerApp'>> {
    const settings: IDeployWorkspaceProjectSettings | undefined = await getContainerAppDeployWorkspaceSettings(rootFolder);
    const noResourceMatch = {
        resourceGroup: undefined,
        managedEnvironment: undefined,
        containerApp: undefined
    };

    if (!settings) {
        ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Scanned and found no local workspace resource settings at "{0}".', fullRelativeSettingsFilePath));
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

export async function getMatchingContainerAppsResources(context: ISubscriptionActionContext, resourceName: string): Promise<Pick<DefaultContainerAppsResources, 'resourceGroup' | 'managedEnvironment' | 'containerApp'>> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
    const containerApps: ContainerApp[] = await uiUtils.listAllIterator(client.containerApps.listBySubscription());

    const ca: ContainerApp | undefined = containerApps.find(ca => ca.name === resourceName);
    const containerApp: ContainerAppModel | undefined = ca ? ContainerAppItem.CreateContainerAppModel(ca) : undefined;

    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    const managedEnvironment = managedEnvironments.find(env => {
        if (containerApp) {
            return env.id === containerApp?.managedEnvironmentId;
        } else {
            return env.name === resourceName;
        }
    });

    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
    const resourceGroup = resourceGroups.find(rg => {
        if (containerApp) {
            return rg.name === containerApp.resourceGroup;
        } else if (managedEnvironment) {
            return rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id'));
        } else {
            return false;
        }
    });

    return {
        resourceGroup,
        managedEnvironment,
        containerApp
    };
}

async function isNameAvailableForContainerAppsResources(context: ISubscriptionActionContext, resourceName: string, resourceGroup?: ResourceGroup, managedEnvironment?: ManagedEnvironment): Promise<boolean> {
    if (!resourceGroup && !await ResourceGroupListStep.isNameAvailable(context, resourceName)) {
        return false;
    }

    if (!managedEnvironment && !await ManagedEnvironmentNameStep.isNameAvailable(context, resourceName, resourceName)) {
        return false;
    }

    if (!await ContainerAppNameStep.isNameAvailable(context, resourceGroup?.name || resourceName, resourceName)) {
        return false;
    }

    return true;
}
