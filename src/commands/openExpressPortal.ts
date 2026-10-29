/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { env, Uri } from "vscode";
import { expressPortalBaseUrl } from "../constants";
import { type ContainerAppItem } from "../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../tree/ManagedEnvironmentItem";
import { pickContainerApp } from "../utils/pickItem/pickContainerApp";

export async function openExpressPortal(context: IActionContext, node?: ContainerAppItem | ManagedEnvironmentItem): Promise<void> {
    const item = node ?? await pickContainerApp(context);
    const isEnvironment = ManagedEnvironmentItem.isManagedEnvironmentItem(item);
    const resource = isEnvironment ? item.managedEnvironment : item.containerApp;
    const resourceType = isEnvironment ? 'environments' : 'apps';
    const url = `${expressPortalBaseUrl}/${resourceType}/${item.subscription.subscriptionId}/${resource.resourceGroup}/${resource.name}/overview`;
    await env.openExternal(Uri.parse(url));
}
