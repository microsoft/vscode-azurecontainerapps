/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { type AuthorizationManagementClient } from "@azure/arm-authorization";
import { type ContainerRegistryManagementClient, type Registry } from '@azure/arm-containerregistry';
import { type OperationalInsightsManagementClient } from '@azure/arm-operationalinsights';
import { ContainerRegistryClient, KnownContainerRegistryAudience } from '@azure/container-registry';
import { createAzureClient, parseClientContext, type AzExtClientContext } from '@microsoft/vscode-azext-azureutils';
import { createSubscriptionContext, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";

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

export function createContainerRegistryClient(context: AzExtClientContext, registry: Registry): ContainerRegistryClient {
    return new ContainerRegistryClient(`https://${registry.loginServer}`, parseClientContext(context).credentials,
        { audience: KnownContainerRegistryAudience.AzureResourceManagerPublicCloud });
}

export async function createOperationalInsightsManagementClient(context: AzExtClientContext): Promise<OperationalInsightsManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-operationalinsights')).OperationalInsightsManagementClient);
}

export async function createAuthorizationManagementClient(context: AzExtClientContext): Promise<AuthorizationManagementClient> {
    return createAzureClient(context, (await import('@azure/arm-authorization')).AuthorizationManagementClient);
}
