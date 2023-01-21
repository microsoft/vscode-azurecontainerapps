/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from '@azure/arm-containerregistry';
import { OperationalInsightsManagementClient } from '@azure/arm-operationalinsights';
import { ContainerRegistryClient, KnownContainerRegistryAudience } from '@azure/container-registry';
import { AzExtClientContext, createAzureClient, parseClientContext } from '@microsoft/vscode-azext-azureutils';
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azext-utils/hostapi.v2";
import { createSubscriptionContext } from "../tree/ContainerAppsBranchDataProvider";

// Lazy-load @azure packages to improve startup performance.
// NOTE: The client is the only import that matters, the rest of the types disappear when compiled to JavaScript

export async function createContainerAppsClient(context: IActionContext, subscription: AzureSubscription): Promise<ContainerAppsAPIClient> {
    return createContainerAppsAPIClient([context, createSubscriptionContext(subscription)]);
}

export async function createContainerAppsAPIClient(context: AzExtClientContext): Promise<ContainerAppsAPIClient> {
    return createAzureClient(context, (await import('@azure/arm-appcontainers')).ContainerAppsAPIClient)
}

export async function createContainerRegistryManagementClient(context: AzExtClientContext): Promise<ContainerRegistryManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-containerregistry')).ContainerRegistryManagementClient);
}

export function createContainerRegistryClient(context: AzExtClientContext, registry: ContainerRegistryManagementModels.Registry): ContainerRegistryClient {
    const clientContext = parseClientContext(context);
    // @azure/container-registry doesn't support ADAL tokens at all.  If it sees `signRequest` is defined
    // it errors, but we don't actually need `signRequest` because this is a T2 package
    const credential = clientContext.credentials as { signRequest: unknown };
    credential.signRequest = undefined;

    return new ContainerRegistryClient(`https://${registry.loginServer}`, clientContext.credentials,
        { audience: KnownContainerRegistryAudience.AzureResourceManagerPublicCloud });
}

export async function createOperationalInsightsManagementClient(context: AzExtClientContext): Promise<OperationalInsightsManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-operationalinsights')).OperationalInsightsManagementClient);
}
