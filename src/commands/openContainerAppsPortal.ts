/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { env, Uri } from "vscode";
import { containerAppsPortalBaseUrl } from "../constants";
import { ContainerAppItem } from "../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../tree/ManagedEnvironmentItem";
import { localize } from "../utils/localize";
import { pickContainerApp } from "../utils/pickItem/pickContainerApp";

export async function openContainerAppsPortal(context: IActionContext, node?: ContainerAppItem | ManagedEnvironmentItem): Promise<void> {
    const item = node ?? await pickContainerApp(context);

    const isEnvironment = ManagedEnvironmentItem.isManagedEnvironmentItem(item);
    const isContainerApp = ContainerAppItem.isContainerAppItem(item);
    if (!isEnvironment && !isContainerApp) {
        throw new Error(localize('invalidContainerAppsPortalItem', 'Select a container app or managed environment to open in the Container Apps portal.'));
    }

    const resource = isEnvironment ? item.managedEnvironment : item.containerApp;
    const resourceType = isEnvironment ? 'environments' : 'apps';
    const url = `${containerAppsPortalBaseUrl}/${resourceType}/${item.subscription.subscriptionId}/${resource.resourceGroup}/${resource.name}/overview`;
    await env.openExternal(Uri.parse(url));
}
