/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { Registry } from "@azure/arm-containerregistry";
import { ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { ContainerAppNameStep } from "../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../createManagedEnvironment/ManagedEnvironmentNameStep";
import { AcrListStep } from "../deployImage/imageSource/containerRegistry/acr/AcrListStep";
import { getMostUsedManagedEnvironmentResources } from "./getMostUsedManagedEnvironmentResources";

interface DefaultContainerAppsResources {
    newResourceGroupName?: string;
    newManagedEnvironmentName?: string;
    newContainerAppName?: string;

    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    containerApp?: ContainerAppModel;
}

export async function getDefaultContainerAppsResources(context: ISubscriptionActionContext, resourceNameBase: string): Promise<DefaultContainerAppsResources> {
    resourceNameBase = resourceNameBase.toLowerCase();

    // For testing creation of resources
    // const resourceGroup = undefined;
    // const managedEnvironment = undefined;
    // const containerApp = undefined;

    // Strategy 1: See if we can reuse resources we already created before
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

    // Strategy 2: If not, try finding the most used managed environment resources (Azure CLI strategy)
    const { managedEnvironment: mostUsedManagedEnvironment, resourceGroup: mostUsedEnvironmentResourceGroup } = await getMostUsedManagedEnvironmentResources(context) ?? { managedEnvironment: undefined, resourceGroup: undefined };
    if (!await isNameAvailableForContainerAppsResources(context, resourceNameBase, mostUsedEnvironmentResourceGroup, mostUsedManagedEnvironment)) {
        throw new Error(localize('resourceNameError', 'Some resource names matching the current workspace "{0}" are already taken.', resourceNameBase));
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

interface DefaultAzureContainerRegistry {
    // Found existing
    registry?: Registry;

    // Create new
    newRegistryName?: string;
}

export async function getDefaultAzureContainerRegistry(context: ISubscriptionActionContext, resourceNameBase: string): Promise<DefaultAzureContainerRegistry> {
    const registries: Registry[] = await AcrListStep.getRegistries(context);
    const registry: Registry | undefined = registries.find(r => r.name === resourceNameBase);

    // If no registry, create new (add later)

    return {
        registry,
        newRegistryName: undefined
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
