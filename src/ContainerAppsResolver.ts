/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { AppResource, AppResourceResolver, ResolvedAppResourceBase } from "@microsoft/vscode-azext-utils/hostapi";
import { managedEnvironmentsAppProvider } from "./constants";
import { ResolvedContainerEnvironmentResource } from "./tree/ResolvedContainerAppsResource";
import { createContainerAppsAPIClient } from "./utils/azureClients";

export class ContainerAppsResolver implements AppResourceResolver {
    public async resolveResource(subContext: ISubscriptionContext, resource: AppResource): Promise<ResolvedAppResourceBase | null> {
        return await callWithTelemetryAndErrorHandling('resolveResource', async (context: IActionContext) => {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, subContext]);
            const rgName: string = getResourceGroupFromId(resource.id);
            const me: ManagedEnvironment = await client.managedEnvironments.get(rgName, resource.name);
            return new ResolvedContainerEnvironmentResource(subContext, me);
        }) ?? null;
    }

    public matchesResource(resource: AppResource): boolean {
        return resource.type.toLowerCase() === managedEnvironmentsAppProvider.toLowerCase();
    }
}
