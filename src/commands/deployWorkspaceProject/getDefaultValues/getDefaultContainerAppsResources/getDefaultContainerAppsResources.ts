/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { type ContainerAppItem, type ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { type ManagedEnvironmentItem } from "../../../../tree/ManagedEnvironmentItem";
import { type DeployWorkspaceProjectContext } from "../../DeployWorkspaceProjectContext";
import { type DeployWorkspaceProjectSettingsV1 } from "../../settings/DeployWorkspaceProjectSettingsV1";
import { getContainerAppResourcesFromItem, getContainerAppResourcesFromSettings } from "./getDefaultResourcesFrom";
import { promptForEnvironmentResources } from "./promptForEnvironmentResources";

export interface DefaultContainerAppsResources {
    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;
    containerApp?: ContainerAppModel;
}

export async function getDefaultContainerAppsResources(
    context: ISubscriptionActionContext & Partial<DeployWorkspaceProjectContext>,
    settings: DeployWorkspaceProjectSettingsV1,
    item?: ContainerAppItem | ManagedEnvironmentItem
): Promise<DefaultContainerAppsResources> {
    context.telemetry.properties.promptedForEnvironment = 'false';  // Initialize the default value

    // If a tree item is provided that can be used to deduce default context values, try to use those first
    if (item) {
        return await getContainerAppResourcesFromItem(context, item);
    }

    // Otherwise try to obtain container app resources using any saved workspace settings
    const { resourceGroup, managedEnvironment, containerApp } = await getContainerAppResourcesFromSettings(context, settings);
    if (resourceGroup && managedEnvironment && containerApp) {
        return { resourceGroup, managedEnvironment, containerApp };
    }

    // Otherwise prompt the user for managed environment resources to use
    return await promptForEnvironmentResources(context);
}
