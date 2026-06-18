/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type AzureSubscriptionProvider } from '@microsoft/vscode-azext-azureauth';
import { type AzureDevOpsSubscriptionProviderInitializer, createAzureDevOpsSubscriptionProviderFactory } from '@microsoft/vscode-azext-azureauth/azdo';
import { type apiUtils } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';

/**
 * Minimal typing for the RG extension's test API (version 99.0.0).
 * Only includes the fields we need.
 */
interface ResourceGroupsTestApi {
    apiVersion: '99.0.0';
    testing: {
        setOverrideAzureSubscriptionProvider(provider: (() => AzureSubscriptionProvider) | undefined): void;
    };
}

/**
 * Sets up the Azure DevOps subscription provider and installs it as the override
 * on the Resource Groups extension via its test API.
 *
 * This ensures the RG extension's tree is authenticated with federated credentials,
 * which fixes `subscriptionExperience` calls both in test setup and inside extension
 * commands (e.g. `createManagedEnvironment`, `deployWorkspaceProject`).
 *
 * Modeled after the pattern in vscode-azureresourcegroups `test/utils/azureDevOpsSubscriptionProvider.ts`.
 *
 * Environment variables used:
 * - `FC_SERVICE_CONNECTION_ID` (or `AzCode_ServiceConnectionID`)
 * - `FC_SERVICE_CONNECTION_TENANT_ID` (or `AzCode_ServiceConnectionDomain`)
 * - `FC_SERVICE_CONNECTION_CLIENT_ID` (or `AzCode_ServiceConnectionClientID`)
 */
export async function setupAzureDevOpsSubscriptionProvider(): Promise<void> {
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

    // Install the provider as the override on the RG extension so its tree
    // and all downstream subscriptionExperience calls use federated credentials.
    const rgTestApi = await getResourceGroupsTestApi();
    rgTestApi.testing.setOverrideAzureSubscriptionProvider(() => provider);

    console.log('[nightly-setup] Installed AzDO subscription provider override on RG extension');
}

async function getResourceGroupsTestApi(): Promise<ResourceGroupsTestApi> {
    const extension = vscode.extensions.getExtension('ms-azuretools.vscode-azureresourcegroups');
    if (!extension) {
        throw new Error('Azure Resource Groups extension not found');
    }

    if (!extension.isActive) {
        await extension.activate();
    }

    const apiProvider: apiUtils.AzureExtensionApiProvider = extension.exports;
    const testApi = apiProvider.getApi<ResourceGroupsTestApi>('>=99.0.0');

    if (!testApi) {
        throw new Error('RG test API (>=99.0.0) not available. Ensure VSCODE_RUNNING_TESTS is set.');
    }

    return testApi;
}
