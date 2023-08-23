/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";

interface MostUsedManagedEnvironmentResources {
    managedEnvironment: ManagedEnvironment;
    resourceGroup: ResourceGroup;
}

export async function getMostUsedManagedEnvironmentResources(context: ISubscriptionActionContext): Promise<MostUsedManagedEnvironmentResources | undefined> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

    const containerApps: ContainerApp[] = (await uiUtils.listAllIterator(client.containerApps.listBySubscription()));
    const mostUsedManagedEnvironmentId: string | undefined = getMostUsedManagedEnvironmentId(containerApps);
    if (!mostUsedManagedEnvironmentId) {
        return undefined;
    }

    const resourceGroupName: string = getResourceGroupFromId(mostUsedManagedEnvironmentId);
    const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);

    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());

    return {
        managedEnvironment: nonNullValue(managedEnvironments.find(env => env.id === mostUsedManagedEnvironmentId)),
        resourceGroup: nonNullValue(resourceGroups.find(rg => rg.name === resourceGroupName))
    };
}

function getMostUsedManagedEnvironmentId(containerApps: ContainerApp[]): string | undefined {
    const managedEnvironmentMap: Map<string, number> = new Map();

    let mostUsedCount: number = 0;
    let mostUsedId: string | undefined;

    for (const ca of containerApps) {
        const id: string = nonNullProp(ca, 'managedEnvironmentId');
        let recentlySetCount: number | undefined;

        if (!managedEnvironmentMap.has(id)) {
            recentlySetCount = 1;
            managedEnvironmentMap.set(id, recentlySetCount);
        } else {
            recentlySetCount = <number>managedEnvironmentMap.get(id) + 1;
            managedEnvironmentMap.set(id, recentlySetCount);
        }

        if (recentlySetCount > mostUsedCount) {
            mostUsedCount = recentlySetCount;
            mostUsedId = ca.managedEnvironmentId;
        }
    }

    return mostUsedId;
}
