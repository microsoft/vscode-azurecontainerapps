/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient } from '@azure/arm-resources';
import { createAzureClient } from '@microsoft/vscode-azext-azureutils';
import { createSubscriptionContext, createTestActionContext, subscriptionExperience, type ISubscriptionContext, type TestActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { longRunningTestsEnabled, longRunningRemoteTestsEnabled } from '../global.test';
import { setupAzureDevOpsSubscriptionProvider } from '../utils/azureDevOpsSubscriptionProvider';
import { getCachedTestApi } from '../utils/testApiAccess';

export let subscriptionContext: ISubscriptionContext;
export const resourceGroupsToDelete = new Set<string>();

suiteSetup(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        return;
    }

    this.timeout(2 * 60 * 1000);

    if (longRunningRemoteTestsEnabled) {
        // In CI, use the AzDO subscription provider to authenticate via federated credentials
        // and get subscriptions directly — bypassing the tree data provider and quick pick UI.
        // Modeled after the pattern in vscode-azureresourcegroups crud.test.ts.
        const subscription = await setupAzureDevOpsSubscriptionProvider();
        subscriptionContext = createSubscriptionContext(subscription);
    } else {
        // For local long-running tests, use the normal login + tree flow
        await vscode.commands.executeCommand('azureResourceGroups.logIn');

        // Refresh the tree and wait for any pending tree operations to settle.
        // This avoids a race condition where a background tree refresh (triggered by
        // the logIn command) cancels our getChildren() call via the shared cancellation
        // token in AzureResourceTreeDataProvider.
        await vscode.commands.executeCommand('azureResourceGroups.refresh');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const testApi = getCachedTestApi();
        const rgApiV2 = await testApi.extensionVariables.getRgApiV2();
        const context: TestActionContext = await createTestActionContext();
        const subscription = await subscriptionExperience(context, rgApiV2.resources.azureResourceTreeDataProvider);
        subscriptionContext = createSubscriptionContext(subscription);
    }
});

suiteTeardown(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        return;
    }

    // Account for the fact that it can take an extremely long time to delete managed environment resources
    this.timeout(60 * 60 * 1000);
    console.log(`[nightly-teardown] subscriptionContext defined: ${!!subscriptionContext}`);
    if (!subscriptionContext) {
        console.log('[nightly-teardown] Skipping resource group cleanup — subscriptionContext was never set (suiteSetup likely failed)');
        return;
    }
    await deleteResourceGroups();
});

async function deleteResourceGroups(): Promise<void> {
    const context: TestActionContext = await createTestActionContext();
    const rgClient: ResourceManagementClient = createAzureClient([context, subscriptionContext], ResourceManagementClient);

    await Promise.all(Array.from(resourceGroupsToDelete).map(async resourceGroup => {
        if (!(await rgClient.resourceGroups.checkExistence(resourceGroup)).body) {
            return;
        }

        console.log(`Deleting resource group "${resourceGroup}"...`);
        // Don't await, it takes an obscenely long time to delete managed environment resources
        void rgClient.resourceGroups.beginDeleteAndWait(resourceGroup);
    }));
}
