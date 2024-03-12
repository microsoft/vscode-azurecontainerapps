/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient, type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, type AzExtTreeItem } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../../../extensionVariables";
import { ContainerAppItem, type ContainerAppModel } from "../../../../tree/ContainerAppItem";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class ContainerAppResourcesVerifyStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 100;  /** Todo: Figure out a good priority level */

    protected resourceGroup?: ResourceGroup;
    protected managedEnvironment?: ManagedEnvironment;
    protected containerApp?: ContainerAppModel;

    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('validatingContainerAppResources', 'Verifying container app resources...') });

        const settings: DeploymentConfigurationSettings | undefined = context.deploymentConfigurationSettings;
        if (!settings?.resourceGroup || !settings?.containerApp) {
            return;
        }

        try {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

            const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
            this.resourceGroup = resourceGroups.find(rg => rg.name === settings.resourceGroup);

            const containerApp: ContainerApp = await client.containerApps.get(settings.resourceGroup, settings.containerApp);
            this.containerApp = ContainerAppItem.CreateContainerAppModel(containerApp);

            const managedEnvironments: ManagedEnvironment[] = await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
            this.managedEnvironment = managedEnvironments.find(env => env.id === containerApp.managedEnvironmentId);

            context.resourceGroup = this.resourceGroup;
            context.containerApp = this.containerApp;
            context.managedEnvironment = this.managedEnvironment;
        } catch {
            // Swallow error and provide a notifcation to the user
            ext.outputChannel.appendLog(localize('verifyFailed', 'Unable to verify some container app resources matching the selected deployment configuration. You will be prompted to create new ones.'));
        }
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings;
    }

    protected createSuccessOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppResourcesVerifyStepSuccessItem', activitySuccessContext]),
                label: localize('verifyContainerAppResources', 'Verify container app resources for configuration "{0}"', context.deploymentConfigurationSettings?.label),
                iconPath: activitySuccessIcon,
                loadMoreChildrenImpl: () => Promise.resolve([
                    this.createChildOutputTreeItem(localize('verifyResourceGroup', 'Verify resource group "{0}"', this.resourceGroup?.name), true /** isSuccessItem */),
                    this.createChildOutputTreeItem(localize('verifyContainerApp', 'Verify container app "{0}"', this.containerApp?.name), true),
                    this.createChildOutputTreeItem(localize('verifyManagedEnvironment', 'Verify managed environment "{0}"', this.managedEnvironment?.name), true),
                ])
            }),
            message: localize('verifiedContainerAppResources', 'Verified container app resources for configuration "{0}"', context.deploymentConfigurationSettings?.label)
        };
    }

    protected createFailOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppResourcesVerifyStepFailItem', activityFailContext]),
                label: localize('verifyContainerAppResources', 'Verify container app resources'),
                iconPath: activityFailIcon,
                loadMoreChildrenImpl: () => {
                    const treeItems: AzExtTreeItem[] = [];
                }
            }),
            message: localize('createContainerAppFail', 'Failed to create container app "{0}".', context.newContainerAppName)
        };
    }

    protected createChildOutputTreeItem(label: string, isSuccessItem: boolean): AzExtTreeItem {
        return new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext([
                `containerAppResourcesVerifyStep${isSuccessItem ? 'Success' : 'Fail'}ChildItem`,
                isSuccessItem ? activitySuccessContext : activityFailContext
            ]),
            label,
            iconPath: isSuccessItem ? activitySuccessIcon : activityFailIcon
        });
    }
}
