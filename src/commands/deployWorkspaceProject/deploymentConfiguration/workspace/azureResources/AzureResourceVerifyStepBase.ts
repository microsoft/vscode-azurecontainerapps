/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { localize } from "../../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../../settings/DeployWorkspaceProjectSettingsV2";
import { type WorkspaceDeploymentConfigurationContext } from "../WorkspaceDeploymentConfigurationContext";

export abstract class AzureResourceVerifyStepBase extends AzureWizardExecuteStep<WorkspaceDeploymentConfigurationContext> {
    public abstract priority: number;

    protected abstract resourceType: 'resource group' | 'container app' | 'container registry';
    protected abstract deploymentSettingsKey: keyof DeploymentConfigurationSettings;
    protected abstract contextKey: keyof WorkspaceDeploymentConfigurationContext;

    public async execute(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.continueOnFail = true;
        progress.report({ message: localize(`verifyingResourceType`, 'Verifying {0}...', this.resourceType) });

        const settings: DeploymentConfigurationSettings | undefined = context.deploymentConfigurationSettings;
        if (!settings?.[this.deploymentSettingsKey]) {
            return;
        }

        await this.verifyResource(context);

        if (!context?.[this.contextKey]) {
            // Throwing this error helps to trigger the failed output state
            // However, since we specified for the error to be swallowed, we shouldn't ever see it directly
            throw new Error('Could not find the specified resource type.');
        }
    }

    protected abstract verifyResource(context: WorkspaceDeploymentConfigurationContext): Promise<void>;

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings?.[this.deploymentSettingsKey];
    }

    public createSuccessOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        if (!context?.[this.contextKey]) {
            return {};
        }

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['azureResourceVerifyStepSuccessItem', activitySuccessContext]),
                label: this.resourceType.charAt(0).toUpperCase() + this.resourceType.slice(1),
                iconPath: activitySuccessIcon,
            }),
            message: localize('verifiedResource',
                'Successfully verified {0} "{1}".',
                this.resourceType,
                context.deploymentConfigurationSettings?.[this.deploymentSettingsKey] as string,
            ),
        };
    }

    public createFailOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['azureResourceVerifyStepFailItem', activityFailContext]),
                label: this.resourceType.charAt(0).toUpperCase() + this.resourceType.slice(1),
                iconPath: activityFailIcon,
            }),
            message: localize('verifyContainerAppFail',
                'Failed to verify {0} "{1}".',
                this.resourceType,
                context.deploymentConfigurationSettings?.[this.deploymentSettingsKey] as string,
            )
        };
    }
}
