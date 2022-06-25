/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext } from "@microsoft/vscode-azext-utils";
import { AppResource, AppResourceResolver, ResolvedAppResourceBase } from "@microsoft/vscode-azext-utils/hostapi";
import { containerAppProvider, managedEnvironmentProvider } from "../constants";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { ContainerAppResource } from "./ContainerAppResource";
import { ManagedEnvironmentResource } from "./ManagedEnvironmentResource";

export class ContainerAppsExtResolver implements AppResourceResolver {

    public async resolveResource(subContext: ISubscriptionContext, resource: AppResource): Promise<ResolvedAppResourceBase | null> {
        return await callWithTelemetryAndErrorHandling('resolveResource', async (context: IActionContext) => {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, subContext]);
            if (this.isContainerApp(resource)) {
                const app = await client.containerApps.get(getResourceGroupFromId(resource.id), resource.name);
                return new ContainerAppResource(app || resource as ContainerApp, subContext);
            } else if (this.isManagedEnvironment(resource)) {
                const env = await client.managedEnvironments.get(getResourceGroupFromId(resource.id), resource.name);
                return new ManagedEnvironmentResource(env, subContext);
            }
            return;
        }) ?? null;
    }

    public matchesResource(resource: AppResource): boolean {
        return this.isContainerApp(resource) ||
            this.isManagedEnvironment(resource);
    }

    public isContainerApp(resource: AppResource): boolean {
        return resource.type.toLowerCase() === containerAppProvider;
    }

    public isManagedEnvironment(resource: AppResource): boolean {
        return resource.type.toLowerCase() === managedEnvironmentProvider;
    }
}
