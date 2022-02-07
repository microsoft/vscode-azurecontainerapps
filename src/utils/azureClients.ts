/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from '@azure/arm-appservice';
import { ContainerRegistryManagementClient, ContainerRegistryManagementModels } from '@azure/arm-containerregistry';
import { OperationalInsightsManagementClient } from '@azure/arm-operationalinsights';
import { ContainerRegistryClient, KnownContainerRegistryAudience } from '@azure/container-registry';
import { LogAnalyticsClient } from '@azure/loganalytics';
import { AzExtClientContext, createAzureClient, parseClientContext } from 'vscode-azureextensionui';

// Lazy-load @azure packages to improve startup performance.
// NOTE: The client is the only import that matters, the rest of the types disappear when compiled to JavaScript

export async function createWebSiteClient(context: AzExtClientContext): Promise<WebSiteManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-appservice')).WebSiteManagementClient);
}

export async function createContainerRegistryManagementClient(context: AzExtClientContext): Promise<ContainerRegistryManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-containerregistry')).ContainerRegistryManagementClient);
}

export function createContainerRegistryClient(context: AzExtClientContext, registry: ContainerRegistryManagementModels.Registry): ContainerRegistryClient {
    const clientContext = parseClientContext(context);
    return new ContainerRegistryClient(`https://${registry.loginServer}`, clientContext.credentials,
        { audience: KnownContainerRegistryAudience.AzureResourceManagerPublicCloud });
}

export function createLogAnalyticsClient(context: AzExtClientContext): LogAnalyticsClient {
    const clientContext = parseClientContext(context);
    return new LogAnalyticsClient(clientContext.credentials);
}

export async function createOperationalInsightsManagementClient(context: AzExtClientContext): Promise<OperationalInsightsManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-operationalinsights')).OperationalInsightsManagementClient);
}
