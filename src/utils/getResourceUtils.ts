/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { nonNullValue, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppModel } from "../tree/ContainerAppItem";
import { createContainerAppsAPIClient } from "./azureClients";

export async function getManagedEnvironmentFromContainerApp(context: ISubscriptionActionContext, containerApp: ContainerAppModel): Promise<ManagedEnvironment> {
    const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
    const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    return nonNullValue(managedEnvironments.find(m => m.id === containerApp.managedEnvironmentId));
}
