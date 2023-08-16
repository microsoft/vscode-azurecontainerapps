/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { createContainerAppsAPIClient } from "../../utils/azureClients";

interface MostUsedManagedEnvironmentData {
    managedEnvironmentName: string;
    resourceGroupName: string;
}

export async function getMostUsedManagedEnvironmentData(context: ISubscriptionActionContext): Promise<MostUsedManagedEnvironmentData | undefined> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

    const containerApps: ContainerApp[] = (await uiUtils.listAllIterator(client.containerApps.listBySubscription()));
    const mostUsedManagedEnvironmentId: string | undefined = getMostUsedManagedEnvironmentId(containerApps);
    if (!mostUsedManagedEnvironmentId) {
        return undefined;
    }

    return {
        managedEnvironmentName: mostUsedManagedEnvironmentId.substring(mostUsedManagedEnvironmentId.lastIndexOf('/') + 1),
        resourceGroupName: getResourceGroupFromId(mostUsedManagedEnvironmentId)
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
