/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type AzureDevOpsSubscriptionProviderInitializer, createAzureDevOpsSubscriptionProviderFactory } from '@microsoft/vscode-azext-azureauth/azdo';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';

/**
 * Creates and signs in an Azure DevOps subscription provider using federated credentials,
 * then returns the first available subscription.
 *
 * This bypasses the VS Code tree data provider and quick pick UI, authenticating directly
 * via the Azure DevOps service connection environment variables set in CI pipelines.
 *
 * Modeled after the pattern in vscode-azureresourcegroups `test/utils/azureDevOpsSubscriptionProvider.ts`.
 *
 * Environment variables used:
 * - `FC_SERVICE_CONNECTION_ID` (or `AzCode_ServiceConnectionID`)
 * - `FC_SERVICE_CONNECTION_TENANT_ID` (or `AzCode_ServiceConnectionDomain`)
 * - `FC_SERVICE_CONNECTION_CLIENT_ID` (or `AzCode_ServiceConnectionClientID`)
 */
export async function setupAzureDevOpsSubscriptionProvider(): Promise<AzureSubscription> {
    const serviceConnectionId = process.env['FC_SERVICE_CONNECTION_ID'] ?? process.env['AzCode_ServiceConnectionID'];
    const tenantId = process.env['FC_SERVICE_CONNECTION_TENANT_ID'] ?? process.env['AzCode_ServiceConnectionDomain'];
    const clientId = process.env['FC_SERVICE_CONNECTION_CLIENT_ID'] ?? process.env['AzCode_ServiceConnectionClientID'];

    if (!serviceConnectionId || !tenantId || !clientId) {
        throw new Error(
            `Azure DevOps federated credentials not configured.\n` +
            `  FC_SERVICE_CONNECTION_ID: ${serviceConnectionId ? '✅' : '❌'}\n` +
            `  FC_SERVICE_CONNECTION_TENANT_ID: ${tenantId ? '✅' : '❌'}\n` +
            `  FC_SERVICE_CONNECTION_CLIENT_ID: ${clientId ? '✅' : '❌'}`
        );
    }

    const initializer: AzureDevOpsSubscriptionProviderInitializer = {
        serviceConnectionId,
        tenantId,
        clientId,
    };

    const factory = createAzureDevOpsSubscriptionProviderFactory(initializer);
    const provider = await factory();

    const signedIn = await provider.signIn();
    if (!signedIn) {
        throw new Error('Azure DevOps subscription provider sign-in failed');
    }

    const subscriptions = await provider.getAvailableSubscriptions();
    if (subscriptions.length === 0) {
        throw new Error('No Azure subscriptions found via Azure DevOps federated credentials');
    }

    console.log(`[nightly-setup] Authenticated via AzDO federated credentials. Found ${subscriptions.length} subscription(s). Using: ${subscriptions[0].name} (${subscriptions[0].subscriptionId})`);

    // Cast is safe — the auth provider's AzureSubscription is structurally compatible
    // with the one from @microsoft/vscode-azureresources-api
    return subscriptions[0] as unknown as AzureSubscription;
}
