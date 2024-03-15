/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, type AzExtTreeItem } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ContainerAppItem } from "../../../../tree/ContainerAppItem";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class ContainerAppResourcesVerifyStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('verifyingContainerAppResources', 'Verifying container app resources...') });

        const settings: DeploymentConfigurationSettings | undefined = context.deploymentConfigurationSettings;
        if (!settings?.resourceGroup || !settings?.containerApp) {
            return;
        }

        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        context.resourceGroup = resourceGroups.find(rg => rg.name === settings.resourceGroup);

        const containerApp: ContainerApp = await client.containerApps.get(settings.resourceGroup, settings.containerApp);
        context.containerApp = ContainerAppItem.CreateContainerAppModel(containerApp);
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings && (!context.resourceGroup || !context.containerApp);
    }

    protected createSuccessOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppResourcesVerifyStepSuccessItem', activitySuccessContext]),
                label: localize('verifyContainerAppResources', 'Verify container app resources'),
                iconPath: activitySuccessIcon,

                loadMoreChildrenImpl: () => Promise.resolve([
                    this.createChildOutputTreeItem(localize('verifyResourceGroupSuccess', 'Verify resource group "{0}"', context.resourceGroup?.name), true /** isSuccessItem */),
                    this.createChildOutputTreeItem(localize('verifyContainerAppSuccess', 'Verify container app "{0}"', context.containerApp?.name), true),
                ])
            }),
            message: localize('verifiedContainerAppResources',
                'Successfully verified resource group "{0}" and container app "{1}" for configuration "{2}"',
                context.resourceGroup?.name,
                context.containerApp?.name,
                context.deploymentConfigurationSettings?.label
            ),
        };
    }

    protected createFailOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppResourcesVerifyStepFailItem', activityFailContext]),
                label: localize('verifyContainerAppResources', 'Verify container app resources'),
                iconPath: activityFailIcon,

                loadMoreChildrenImpl: () => Promise.resolve([
                    context.resourceGroup ?
                        this.createChildOutputTreeItem(localize('verifyResourceGroupSuccess', 'Verify resource group "{0}"', context.resourceGroup.name), true /** isSuccessItem */) :
                        this.createChildOutputTreeItem(localize('verifyResourceGroupFail', 'Verify resource group "{0}"', context.deploymentConfigurationSettings?.resourceGroup), false),
                    context.containerApp ?
                        this.createChildOutputTreeItem(localize('verifyContainerAppSuccess', 'Verify container app "{0}"', context.containerApp.name), true) :
                        this.createChildOutputTreeItem(localize('verifyContainerAppFail', 'Verify container app "{0}"', context.deploymentConfigurationSettings?.containerApp), false),
                ])
            }),
            message: localize('createContainerAppFail', 'Failed to verify some container app resources for configuration "{0}".  You will be prompted to create new resource(s) to proceed.', context.deploymentConfigurationSettings?.label)
        };
    }

    protected createChildOutputTreeItem(label: string, isSuccessItem: boolean): AzExtTreeItem {
        return new GenericTreeItem(undefined, {
            label,
            iconPath: isSuccessItem ? activitySuccessIcon : activityFailIcon,
            contextValue: createActivityChildContext([
                `containerAppResourcesVerifyStep${isSuccessItem ? 'Success' : 'Fail'}ChildItem`,
                isSuccessItem ? activitySuccessContext : activityFailContext
            ]),
        });
    }
}
