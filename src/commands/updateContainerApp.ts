/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { createSubscriptionContext, IActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { createContainerAppsAPIClient } from "../utils/azureClients";

export async function updateContainerApp(context: IActionContext, subscription: AzureSubscription, containerApp: ContainerApp, updatedSetting: Omit<ContainerApp, 'location'>): Promise<void> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(subscription)]);
    const resourceGroupName = getResourceGroupFromId(nonNullProp(containerApp, 'id'));
    const name = nonNullProp(containerApp, 'name');
    const updatedApp: ContainerApp = { ...updatedSetting, location: containerApp.location };

    await client.containerApps.beginUpdateAndWait(resourceGroupName, name, updatedApp);
}
