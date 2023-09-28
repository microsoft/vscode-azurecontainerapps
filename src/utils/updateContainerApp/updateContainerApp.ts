/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { IActionContext, createSubscriptionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { createContainerAppsAPIClient } from "../azureClients";

export async function updateContainerApp(context: IActionContext, subscription: AzureSubscription, containerApp: ContainerApp, updatedSetting?: Omit<ContainerApp, 'location'>): Promise<void> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(subscription)]);
    const resourceGroupName = getResourceGroupFromId(nonNullProp(containerApp, 'id'));
    const name = nonNullProp(containerApp, 'name');
    // If no update setting is provided, just use the original containerApp; otherwise, merge the update settings with the original containerApp
    const updatedApp: ContainerApp = !updatedSetting ? containerApp : { ...updatedSetting, location: containerApp.location };
    await client.containerApps.beginUpdateAndWait(resourceGroupName, name, updatedApp);
}
