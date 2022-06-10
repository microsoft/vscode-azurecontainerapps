/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppTreeItem } from "../tree/ContainerAppTreeItem";
import { createContainerAppsAPIClient } from "../utils/azureClients";

export async function updateContainerApp(context: IActionContext, node: ContainerAppTreeItem, updatedSetting: Omit<ContainerApp, 'location'>): Promise<void> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, node]);
    const resourceGroupName = node.resourceGroupName;
    const name = node.name;
    const updatedApp: ContainerApp = { ...updatedSetting, location: node.data.location };

    await client.containerApps.beginUpdateAndWait(resourceGroupName, name, updatedApp);
}
