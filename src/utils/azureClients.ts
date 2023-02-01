/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { ContainerRegistryManagementClient, Registry } from '@azure/arm-containerregistry';
import { OperationalInsightsManagementClient } from '@azure/arm-operationalinsights';
import { ContainerRegistryClient, KnownContainerRegistryAudience } from '@azure/container-registry';
import { AzExtClientContext, createAzureClient, parseClientContext } from '@microsoft/vscode-azext-azureutils';

// Lazy-load @azure packages to improve startup performance.
// NOTE: The client is the only import that matters, the rest of the types disappear when compiled to JavaScript

export async function createContainerAppsAPIClient(clientContext: AzExtClientContext): Promise<ContainerAppsAPIClient> {
    const context = parseClientContext(clientContext);
    return new ContainerAppsAPIClient(context.credentials, context.subscriptionId);
}

export async function createContainerRegistryManagementClient(context: AzExtClientContext): Promise<ContainerRegistryManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-containerregistry')).ContainerRegistryManagementClient);
}

export function createContainerRegistryClient(context: AzExtClientContext, registry: Registry): ContainerRegistryClient {
    const clientContext = parseClientContext(context);
    return new ContainerRegistryClient(`https://${registry.loginServer}`, clientContext.credentials,
        { audience: KnownContainerRegistryAudience.AzureResourceManagerPublicCloud });
}

export async function createOperationalInsightsManagementClient(context: AzExtClientContext): Promise<OperationalInsightsManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-operationalinsights')).OperationalInsightsManagementClient);
}
