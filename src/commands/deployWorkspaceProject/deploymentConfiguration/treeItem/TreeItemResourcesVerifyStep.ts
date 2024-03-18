/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, getResourceGroupFromId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { ContainerAppItem, type ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../../tree/ManagedEnvironmentItem";
import { localize } from "../../../../utils/localize";
import { type TreeItemDeploymentConfigurationContext } from "./getTreeItemDeploymentConfiguration";

export class TreeItemResourcesVerifyStep extends AzureWizardExecuteStep<TreeItemDeploymentConfigurationContext> {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    constructor(private readonly treeItem: ContainerAppItem | ManagedEnvironmentItem) {
        super();
    }

    public async execute(context: TreeItemDeploymentConfigurationContext): Promise<void> {
        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);

        if (ContainerAppItem.isContainerAppItem(this.treeItem)) {
            const containerApp: ContainerAppModel = this.treeItem.containerApp;
            context.resourceGroup = resourceGroups.find(rg => rg.name === containerApp.resourceGroup);
            context.containerApp = containerApp;
        } else if (ManagedEnvironmentItem.isManagedEnvironmentItem(this.treeItem)) {
            const managedEnvironment: ManagedEnvironment = this.treeItem.managedEnvironment;
            context.resourceGroup = resourceGroups.find(rg => rg.name === getResourceGroupFromId(nonNullProp(managedEnvironment, 'id')));
            context.managedEnvironment = managedEnvironment;
        } else {
            const incompatibleMessage: string = localize('incompatibleTreeItem', 'An incompatible tree item was provided to Azure Container Apps for project deployment.');
            ext.outputChannel.appendLog(localize('incompatibleMessageLog', 'Error: {0}', incompatibleMessage));
            throw new Error(incompatibleMessage);
        }
    }

    public shouldExecute(): boolean {
        return true;
    }
}
