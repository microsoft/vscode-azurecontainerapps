/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../utils/activity/activityUtils";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { type CreateManagedEnvironmentContext } from "./CreateManagedEnvironmentContext";

export class LogAnalyticsCreateStep extends ExecuteActivityOutputStepBase<CreateManagedEnvironmentContext> {
    public priority: number = 220;

    protected async executeCore(context: CreateManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const opClient = await createOperationalInsightsManagementClient(context);
        const resourceGroup = nonNullProp(context, 'resourceGroup');
        const workspaceName = context.newLogAnalyticsWorkspaceName || nonNullProp(context, 'newManagedEnvironmentName');

        const creating: string = localize('creatingLogAnalyticsWorkspace', 'Creating log analytics workspace...');
        progress.report({ message: creating });

        context.logAnalyticsWorkspace = await opClient.workspaces.beginCreateOrUpdateAndWait(
            nonNullProp(resourceGroup, 'name'), workspaceName, { location: (await LocationListStep.getLocation(context)).name });
    }

    public shouldExecute(context: CreateManagedEnvironmentContext): boolean {
        return !context.logAnalyticsWorkspace;
    }

    protected createSuccessOutput(context: CreateManagedEnvironmentContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['logAnalyticsCreateStepSuccessItem', activitySuccessContext]),
                label: localize('createWorkspace', 'Create log analytics workspace "{0}"', context.newLogAnalyticsWorkspaceName || context.newManagedEnvironmentName),
                iconPath: activitySuccessIcon
            }),
            message: localize('createLogAnalyticsWorkspaceSuccess', 'Created log analytics workspace "{0}".', context.newLogAnalyticsWorkspaceName || context.newManagedEnvironmentName)
        };
    }

    protected createFailOutput(context: CreateManagedEnvironmentContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['logAnalyticsCreateStepFailItem', activityFailContext]),
                label: localize('createWorkspace', 'Create log analytics workspace "{0}"', context.newLogAnalyticsWorkspaceName || context.newManagedEnvironmentName),
                iconPath: activityFailIcon
            }),
            message: localize('createLogAnalyticsWorkspaceFail', 'Failed to create log analytics workspace "{0}".', context.newLogAnalyticsWorkspaceName || context.newManagedEnvironmentName)
        };
    }
}
