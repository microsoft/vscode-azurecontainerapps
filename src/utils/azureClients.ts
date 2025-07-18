/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { type AuthorizationManagementClient } from "@azure/arm-authorization";
import { type ContainerRegistryManagementClient, type Registry } from '@azure/arm-containerregistry';
import { type OperationalInsightsManagementClient } from '@azure/arm-operationalinsights';
import { ContainerRegistryClient, KnownContainerRegistryAudience } from '@azure/container-registry';
import { LogsQueryClient } from "@azure/monitor-query";
import { Environment } from "@azure/ms-rest-azure-env";
import { createAzureClient, parseClientContext, type AzExtClientContext } from '@microsoft/vscode-azext-azureutils';
import { createSubscriptionContext, type IActionContext, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { localize } from "./localize";

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
    if (parseClientContext(context).isCustomCloud) {
        return <AuthorizationManagementClient><unknown>createAzureClient(context, (await import('@azure/arm-authorization-profile-2020-09-01-hybrid')).AuthorizationManagementClient);
    } else {
        return createAzureClient(context, (await import('@azure/arm-authorization')).AuthorizationManagementClient);
    }
}

/**
 * @throws Throws an error if logsQueryClient is created by a user in a sovereign cloud environment.
 * These need scope and endpoint verification before we are able to fully support.
 */
export async function createLogsQueryClient(context: ISubscriptionActionContext): Promise<LogsQueryClient> {
    const notImplementedError: string = localize('notImplemented', 'Internal error: Log query client needs implementation for use in cloud environment "{0}".', context.environment.name);

    // https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/monitor/monitor-query#configure-client-for-azure-sovereign-cloud
    // Todo: Add / verify sovereign cloud endpoints / scopes

    let scope: string;
    switch (context.environment.name) {
        case Environment.USGovernment.name:
            // scope = 'https://api.loganalytics.us/.default';
            // endpoint = 'https://api.loganalytics.us/v1';
            throw new Error(notImplementedError)
        case Environment.GermanCloud.name:
            // scope = 'https://api.loganalytics.de/.default';
            // endpoint = 'https://api.loganalytics.de/v1';
            throw new Error(notImplementedError)
        case Environment.ChinaCloud.name:
            // scope = 'https://api.loganalytics.azure.cn/.default';
            // endpoint = 'https://api.loganalytics.azure.cn/v1';
            throw new Error(notImplementedError)
        case Environment.AzureCloud.name:
        default:
            scope = 'https://api.loganalytics.io/.default';
            break;
    }

    return new LogsQueryClient(await context.createCredentialsForScopes([scope]));
}
