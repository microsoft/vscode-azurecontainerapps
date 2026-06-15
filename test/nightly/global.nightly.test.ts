/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient } from '@azure/arm-resources';
import { createAzureClient } from '@microsoft/vscode-azext-azureutils';
import { createSubscriptionContext, createTestActionContext, subscriptionExperience, type ISubscriptionContext, type TestActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { longRunningTestsEnabled } from '../global.test';
import { getCachedTestApi } from '../utils/testApiAccess';

export let subscriptionContext: ISubscriptionContext;
export const resourceGroupsToDelete = new Set<string>();

suiteSetup(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        return;
    }

    this.timeout(2 * 60 * 1000);

    await vscode.commands.executeCommand('azureResourceGroups.logIn');

    // Refresh the tree and wait for any pending tree operations to settle.
    await vscode.commands.executeCommand('azureResourceGroups.refresh');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const testApi = getCachedTestApi();
    const rgApiV2 = await testApi.extensionVariables.getRgApiV2();
    const context: TestActionContext = await createTestActionContext();
    const subscription = await subscriptionExperience(context, rgApiV2.resources.azureResourceTreeDataProvider);
    subscriptionContext = createSubscriptionContext(subscription);
});

suiteTeardown(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        return;
    }

    // Account for the fact that it can take an extremely long time to delete managed environment resources
    this.timeout(60 * 60 * 1000);
    await deleteResourceGroups();
});

async function deleteResourceGroups(): Promise<void> {
    const context: TestActionContext = await createTestActionContext();
    const rgClient: ResourceManagementClient = createAzureClient([context, subscriptionContext], ResourceManagementClient);

    for (const resourceGroup of resourceGroupsToDelete) {
        if (!(await rgClient.resourceGroups.checkExistence(resourceGroup)).body) {
            continue;
        }

        console.log(`Deleting resource group "${resourceGroup}"...`);
        void rgClient.resourceGroups.beginDeleteAndWait(resourceGroup);
    }
}
