/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, type AzExtTreeItem } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class ContainerRegistryVerifyStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 210;  /** Todo: Figure out a good priority level */

    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('verifyingContainerRegistry', 'Verifying container registry...') });

        const settings: DeploymentConfigurationSettings | undefined = context.deploymentConfigurationSettings;
        if (!settings?.containerRegistry) {
            return;
        }

        const registries: Registry[] = await AcrListStep.getRegistries(context);
        context.containerRegistry = registries.find(r => r.name === settings.containerRegistry);
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings;
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
