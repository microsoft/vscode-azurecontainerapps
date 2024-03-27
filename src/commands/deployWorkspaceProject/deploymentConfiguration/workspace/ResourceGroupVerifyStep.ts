/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class ResourceGroupVerifyStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('verifyingResourceGroup', 'Verifying resource group...') });

        const settings: DeploymentConfigurationSettings | undefined = context.deploymentConfigurationSettings;
        if (!settings?.resourceGroup) {
            return;
        }

        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(context);
        context.resourceGroup = resourceGroups.find(rg => rg.name === settings.resourceGroup);
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings?.resourceGroup && !context.resourceGroup;
    }

    protected createSuccessOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        if (!context.resourceGroup) {
            return {};
        }

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['resourceGroupVerifyStepSuccessItem', activitySuccessContext]),
                label: localize('verifyResourceGroup', 'Verify resource group "{0}"', context.resourceGroup?.name),
                iconPath: activitySuccessIcon,
            }),
            message: localize('verifyResourceGroupSuccess',
                'Successfully verified resource group "{0}" from configuration "{1}".',
                context.resourceGroup?.name,
                context.deploymentConfigurationSettings?.label
            ),
        };
    }

    protected createFailOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['ResourceGroupVerifyStepFailItem', activityFailContext]),
                label: localize('verifyResourceGroup', 'Verify resource group "{0}"', context.deploymentConfigurationSettings?.resourceGroup),
                iconPath: activityFailIcon,
            }),
            message: localize('verifyResourceGroupFail',
                'Failed to verify resource group "{0}" from configuration "{1}".',
                context.deploymentConfigurationSettings?.resourceGroup,
                context.deploymentConfigurationSettings?.label
            )
        };
    }
}
