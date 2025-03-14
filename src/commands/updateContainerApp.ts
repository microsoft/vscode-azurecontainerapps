/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { createSubscriptionContext, nonNullProp, type IActionContext } from "@microsoft/vscode-azext-utils";
import { type AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ContainerAppItem, type ContainerAppModel } from "../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../utils/azureClients";

export async function updateContainerApp(context: IActionContext, subscription: AzureSubscription, containerApp: ContainerApp, updatedSetting?: Omit<ContainerApp, 'location'>): Promise<ContainerAppModel> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(subscription)]);
    const resourceGroupName = getResourceGroupFromId(nonNullProp(containerApp, 'id'));
    const name = nonNullProp(containerApp, 'name');
    // If no update setting is provided, just use the original containerApp; otherwise, merge the update settings with the original containerApp
    const updatedApp: ContainerApp = !updatedSetting ? containerApp : { ...updatedSetting, location: containerApp.location };
    return ContainerAppItem.CreateContainerAppModel(await client.containerApps.beginUpdateAndWait(resourceGroupName, name, updatedApp));
}
