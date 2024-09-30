/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, createUniversallyUniqueContextValue, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";

export class LogAnalyticsCreateStep extends AzureWizardExecuteStep<ManagedEnvironmentCreateContext> {
    public priority: number = 220;

    public async execute(context: ManagedEnvironmentCreateContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const opClient = await createOperationalInsightsManagementClient(context);
        const resourceGroup = nonNullProp(context, 'resourceGroup');
        const workspaceName = context.newLogAnalyticsWorkspaceName || nonNullProp(context, 'newManagedEnvironmentName');

        const creating: string = localize('creatingLogAnalyticsWorkspace', 'Creating log analytics workspace...');
        progress.report({ message: creating });

        context.logAnalyticsWorkspace = await opClient.workspaces.beginCreateOrUpdateAndWait(
            nonNullProp(resourceGroup, 'name'), workspaceName, { location: (await LocationListStep.getLocation(context)).name });
    }

    public shouldExecute(context: ManagedEnvironmentCreateContext): boolean {
        return !context.logAnalyticsWorkspace;
    }

    public createSuccessOutput(context: ManagedEnvironmentCreateContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['logAnalyticsCreateStepSuccessItem', activitySuccessContext]),
                label: localize('createWorkspace', 'Create log analytics workspace "{0}"', context.newLogAnalyticsWorkspaceName || context.newManagedEnvironmentName),
                iconPath: activitySuccessIcon
            }),
            message: localize('createLogAnalyticsWorkspaceSuccess', 'Created log analytics workspace "{0}".', context.newLogAnalyticsWorkspaceName || context.newManagedEnvironmentName)
        };
    }

    public createFailOutput(context: ManagedEnvironmentCreateContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['logAnalyticsCreateStepFailItem', activityFailContext]),
                label: localize('createWorkspace', 'Create log analytics workspace "{0}"', context.newLogAnalyticsWorkspaceName || context.newManagedEnvironmentName),
                iconPath: activityFailIcon
            }),
            message: localize('createLogAnalyticsWorkspaceFail', 'Failed to create log analytics workspace "{0}".', context.newLogAnalyticsWorkspaceName || context.newManagedEnvironmentName)
        };
    }
}
