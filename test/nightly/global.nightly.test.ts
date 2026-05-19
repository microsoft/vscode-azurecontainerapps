/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient } from '@azure/arm-resources';
import { createAzureClient } from '@microsoft/vscode-azext-azureutils';
import { createSubscriptionContext, createTestActionContext, subscriptionExperience, type ISubscriptionContext, type TestActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
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

    console.log('[nightly-setup] Executing azureResourceGroups.logIn...');
    await vscode.commands.executeCommand('azureResourceGroups.logIn');
    console.log('[nightly-setup] azureResourceGroups.logIn completed');

    const testApi = getCachedTestApi();
    console.log('[nightly-setup] Got test API');

    const rgApiV2 = await testApi.extensionVariables.getRgApiV2();
    console.log('[nightly-setup] Got rgApiV2');

    const tdp = rgApiV2.resources.azureResourceTreeDataProvider;
    console.log(`[nightly-setup] Got tree data provider: ${!!tdp}`);

    // Enumerate root children to see if subscriptions are available
    try {
        const rootChildren = await tdp.getChildren(undefined) as { id?: string; name?: string; subscription?: { subscriptionId?: string } }[];
        console.log(`[nightly-setup] Tree root children count: ${rootChildren?.length ?? 'null/undefined'}`);
        if (rootChildren) {
            for (const child of rootChildren) {
                const subId = child.subscription?.subscriptionId ?? child.id ?? 'unknown';
                console.log(`[nightly-setup]   child: id=${child.id}, name=${(child as { name?: string }).name}, subscriptionId=${subId}`);
            }
        }
    } catch (e) {
        console.log(`[nightly-setup] Failed to enumerate tree children: ${e}`);
    }

    const context: TestActionContext = await createTestActionContext();
    console.log('[nightly-setup] Created test action context, calling subscriptionExperience...');

    try {
        const subscription: AzureSubscription = await subscriptionExperience(context, tdp);
        console.log(`[nightly-setup] Got subscription: ${subscription.subscriptionId} (${subscription.name})`);
        subscriptionContext = createSubscriptionContext(subscription);
        console.log('[nightly-setup] subscriptionContext created successfully');
    } catch (error) {
        console.log(`[nightly-setup] subscriptionExperience failed: ${error}`);
        throw error;
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
