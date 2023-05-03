/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContainerAppsAPIClient, SourceControl } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { IActionContext, createSubscriptionContext } from "@microsoft/vscode-azext-utils";
import type { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import type { ContainerAppModel } from "../../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "../../utils/azureClients";

export async function getContainerAppSourceControl(context: IActionContext, subscription: AzureSubscription, containerApp: ContainerAppModel): Promise<SourceControl | undefined> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, createSubscriptionContext(subscription)]);
    const sourceControlsIterator = client.containerAppsSourceControls.listByContainerApp(containerApp.resourceGroup, containerApp.name);
    return (await uiUtils.listAllIterator(sourceControlsIterator))[0];
}
