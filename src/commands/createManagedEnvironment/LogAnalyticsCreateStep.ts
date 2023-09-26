/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { GenericTreeItem } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../constants";
import { ExecuteActivityOutput, ExecuteActivityOutputStepBase } from "../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../utils/activity/activityUtils";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValue } from "../../utils/nonNull";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export class LogAnalyticsCreateStep extends ExecuteActivityOutputStepBase<IManagedEnvironmentContext> {
    public priority: number = 220;

    protected async executeCore(context: IManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const opClient = await createOperationalInsightsManagementClient(context);
        const resourceGroup = nonNullValue(context.resourceGroup);
        const workspaceName = nonNullProp(context, 'newManagedEnvironmentName');

        const creating: string = localize('creatingLogAnalyticsWorkspace', 'Creating log analytics workspace...');
        progress.report({ message: creating });

        context.logAnalyticsWorkspace = await opClient.workspaces.beginCreateOrUpdateAndWait(
            nonNullProp(resourceGroup, 'name'), workspaceName, { location: (await LocationListStep.getLocation(context)).name });
    }

    public shouldExecute(context: IManagedEnvironmentContext): boolean {
        return !context.logAnalyticsWorkspace;
    }

    protected initSuccessOutput(context: IManagedEnvironmentContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['logAnalyticsCreateStep', activitySuccessContext]),
                label: localize('createWorkspace', 'Create log analytics workspace "{0}"', context.newManagedEnvironmentName),
                iconPath: activitySuccessIcon
            }),
            output: localize('createLogAnalyticsWorkspaceSuccess', 'Created log analytics workspace "{0}".', context.newManagedEnvironmentName)
        };
    }

    protected initFailOutput(context: IManagedEnvironmentContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['logAnalyticsCreateStep', activityFailContext]),
                label: localize('createWorkspace', 'Create log analytics workspace "{0}"', context.newManagedEnvironmentName),
                iconPath: activityFailIcon
            }),
            output: localize('createLogAnalyticsWorkspaceFail', 'Failed to create log analytics workspace "{0}".', context.newManagedEnvironmentName)
        };
    }
}
