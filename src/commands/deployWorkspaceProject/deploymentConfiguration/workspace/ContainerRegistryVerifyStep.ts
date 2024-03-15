/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "@microsoft/vscode-azext-utils";
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

        if (!context.containerRegistry) {
            throw new Error(localize('registryNotFound', 'Container registry "{0}" not found.', settings.containerRegistry));
        }
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings && !context.containerRegistry;
    }

    protected createSuccessOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryVerifyStepSuccessItem', activitySuccessContext]),
                label: localize('verifyContainerRegistry', 'Verify container registry "{0}"', context.containerRegistry?.name),
                iconPath: activitySuccessIcon,
            }),
            message: localize('verifyContainerRegistrySuccess',
                'Successfully verified container registry "{0}" for configuration "{1}".',
                context.containerRegistry?.name,
                context.deploymentConfigurationSettings?.label
            )
        };
    }

    protected createFailOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerRegistryVerifyStepFailItem', activityFailContext]),
                label: localize('verifyContainerRegistry', 'Verify container registry "{0}"', context.deploymentConfigurationSettings?.containerRegistry),
                iconPath: activityFailIcon,
            }),
            message: localize('verifyContainerRegistryFail',
                'Failed to verify container registry "{0}" for configuration "{1}".',
                context.deploymentConfigurationSettings?.containerRegistry,
                context.deploymentConfigurationSettings?.label
            )
        };
    }
}
