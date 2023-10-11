/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ManagedEnvironment } from "@azure/arm-appcontainers";
import type { ResourceGroup } from "@azure/arm-resources";
import { type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem, ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../../tree/ManagedEnvironmentItem";
import type { DeployWorkspaceProjectSettings } from "../../deployWorkspaceProjectSettings";
import { getContainerAppResourcesFromItem, getContainerAppResourcesFromSettings } from "./getDefaultResourcesFrom";
import { promptForEnvironmentResources } from "./promptForEnvironmentResources";

export interface DefaultContainerAppsResources {
    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    containerApp?: ContainerAppModel;
}

export async function getDefaultContainerAppsResources(
    context: ISubscriptionActionContext,
    settings: DeployWorkspaceProjectSettings | undefined,
    item?: ContainerAppItem | ManagedEnvironmentItem
): Promise<DefaultContainerAppsResources> {
    // Try to obtain container app resources using any saved workspace settings
    const { resourceGroup, managedEnvironment, containerApp } = await getContainerAppResourcesFromSettings(context, settings);
    if (resourceGroup && managedEnvironment && containerApp) {
        return { resourceGroup, managedEnvironment, containerApp };
    }

    // If a tree item is provided that can be used to deduce default context values, use those, otherwise prompt for an environment
    if (item) {
        return await getContainerAppResourcesFromItem(context, item);
    } else {
        return await promptForEnvironmentResources(context);
    }
}
