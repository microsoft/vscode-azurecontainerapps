/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceManagementClient } from '@azure/arm-resources';
import { createAzureClient } from '@microsoft/vscode-azext-azureutils';
import { createTestActionContext, type TestActionContext } from '@microsoft/vscode-azext-dev';
import { createSubscriptionContext, subscriptionExperience, type ISubscriptionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { ext } from '../../extension.bundle';
import { longRunningTestsEnabled } from '../global.test';

export const resourceGroupsToDelete: string[] = [];

suiteSetup(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        return;
    }

    await vscode.commands.executeCommand('azureResourceGroups.logIn');
});

suiteTeardown(async function (this: Mocha.Context): Promise<void> {
    if (!longRunningTestsEnabled) {
        return;
    }

    await deleteResourceGroups();
});

// Todo: re-test this
async function deleteResourceGroups(): Promise<void> {
    const context: TestActionContext = await createTestActionContext();
    const subscription: AzureSubscription = await subscriptionExperience(context, ext.rgApiV2.resources.azureResourceTreeDataProvider);
    const subscriptionContext: ISubscriptionContext = createSubscriptionContext(subscription);

    const rgClient: ResourceManagementClient = createAzureClient([context, subscriptionContext], ResourceManagementClient);
    await Promise.all(resourceGroupsToDelete.map(async resourceGroup => {
        if ((await rgClient.resourceGroups.checkExistence(resourceGroup)).body) {
            console.log(`Started delete of resource group "${resourceGroup}"...`);
            await rgClient.resourceGroups.beginDeleteAndWait(resourceGroup);
            console.log(`Successfully started delete of resource group "${resourceGroup}".`);
        } else {
            console.log(`Ignoring resource group "${resourceGroup}" because it does not exist.`);
        }
    }));
}
