/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ext } from "../../../extensionVariables";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../tree/ManagedEnvironmentItem";
import { localize } from "../../../utils/localize";
import { type DeploymentConfiguration } from "./DeploymentConfiguration";

export async function getTreeItemDeploymentConfiguration(item: ContainerAppItem | ManagedEnvironmentItem): Promise<DeploymentConfiguration> {
    // Todo: Search and add container registry
    if (ContainerAppItem.isContainerAppItem(item)) {
        return { containerApp: item.containerApp };
    } else if (ManagedEnvironmentItem.isManagedEnvironmentItem(item)) {
        return { managedEnvironment: item.managedEnvironment };
    } else {
        const incompatibleMessage: string = localize('incompatibleTreeItem', 'An incompatible tree item was provided to Azure Container Apps for project deployment.');
        ext.outputChannel.appendLog(localize('incompatibleMessageLog', 'Error: {0}', incompatibleMessage));
        throw new Error(incompatibleMessage);
    }
}
