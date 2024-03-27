/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerApp, type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ContainerAppItem } from "../../../../tree/ContainerAppItem";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { createContainerAppsAPIClient } from "../../../../utils/azureClients";
import { localize } from "../../../../utils/localize";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class ContainerAppVerifyStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 205;  /** Todo: Figure out a good priority level */

    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('verifyingContainerApp', 'Verifying container app...') });

        const settings: DeploymentConfigurationSettings | undefined = context.deploymentConfigurationSettings;
        if (!settings?.containerApp) {
            return;
        }

        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);

        const containerApp: ContainerApp = await client.containerApps.get(nonNullValueAndProp(context.resourceGroup, 'name'), settings.containerApp);
        context.containerApp = ContainerAppItem.CreateContainerAppModel(containerApp);

        if (!context.containerApp) {
            throw new Error(localize('noContainerAppError', 'No matching container app found.'));
        }
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings?.containerApp && !context.containerApp;
    }

    protected createSuccessOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        if (!context.containerApp) {
            return {};
        }

        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppVerifyStepSuccessItem', activitySuccessContext]),
                label: localize('verifyContainerApp', 'Verify container app "{0}"', context.containerApp?.name),
                iconPath: activitySuccessIcon,
            }),
            message: localize('verifiedContainerApp',
                'Successfully verified container app "{0}" from configuration "{1}".',
                context.containerApp?.name,
                context.deploymentConfigurationSettings?.label
            ),
        };
    }

    protected createFailOutput(context: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['containerAppVerifyStepFailItem', activityFailContext]),
                label: localize('verifyContainerApp', 'Verify container app "{0}"', context.deploymentConfigurationSettings?.containerApp),
                iconPath: activityFailIcon,
            }),
            message: localize('verifyContainerAppFail',
                'Failed to verify container app "{0}" from configuration "{1}".',
                context.deploymentConfigurationSettings?.containerApp,
                context.deploymentConfigurationSettings?.label
            )
        };
    }
}
