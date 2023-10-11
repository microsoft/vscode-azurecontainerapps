/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { ISubscriptionActionContext, nonNullValue } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../tree/ManagedEnvironmentItem";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import type { DeployWorkspaceProjectSettings } from "../deployWorkspaceProjectSettings";

/**
 * @throws Throws an error if there is a deployment target mismatch between the tree item and workspace settings provided
 */
export async function throwIfTreeItemAndWorkspaceSettingsConflict(
    context: ISubscriptionActionContext,
    item: ContainerAppItem | ManagedEnvironmentItem | undefined,
    settings: DeployWorkspaceProjectSettings
): Promise<void> {
    if (!item || (!settings.containerAppName && !settings.containerAppResourceGroupName)) {
        return;
    }

    const hasContainerAppItemConflict: boolean =
        ContainerAppItem.isContainerAppItem(item) &&
        (item.containerApp.name !== settings.containerAppName ||
            item.containerApp.resourceGroup !== settings.containerAppResourceGroupName);

    const hasManagedEnvironmentItemConflict: boolean =
        ManagedEnvironmentItem.isManagedEnvironmentItem(item) &&
        (item.managedEnvironment.id !== await getEnvironmentIdUsingContainerAppInputsHelper(context, settings.containerAppName, settings.containerAppResourceGroupName));

    if (hasContainerAppItemConflict || hasManagedEnvironmentItemConflict) {
        const mistmatchMessage: string = localize('mismatchMessage', `The detected workspace setting and selected tree item have conflicting deployment targets.`);
        ext.outputChannel.appendLog(localize('mismatchLogMessage', 'Error: {0}', mistmatchMessage));
        throw new Error(mistmatchMessage);
    }
}

async function getEnvironmentIdUsingContainerAppInputsHelper(
    context: ISubscriptionActionContext,
    containerAppName: string | undefined,
    containerAppResourceGroupName: string | undefined
): Promise<string | undefined> {
    try {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const containerApp: ContainerApp = await client.containerApps.get(nonNullValue(containerAppName), nonNullValue(containerAppResourceGroupName));
        return containerApp.managedEnvironmentId;
    } catch {
        return undefined;
    }
}
