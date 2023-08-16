/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericTreeItem, createContextValue } from "@microsoft/vscode-azext-utils";
import { randomUUID } from "crypto";
import { Progress, ThemeColor, ThemeIcon } from "vscode";
import { activitySuccessContext } from "../../constants";
import { ext } from "../../extensionVariables";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValue } from "../../utils/nonNull";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export class LogAnalyticsCreateStep extends AzureWizardExecuteStep<IManagedEnvironmentContext> {
    public priority: number = 200;

    public async execute(context: IManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const opClient = await createOperationalInsightsManagementClient(context);
        const resourceGroup = nonNullValue(context.resourceGroup);
        const workspaceName = nonNullProp(context, 'newManagedEnvironmentName');

        const creating: string = localize('creatingLogAnalyticsWorkspace', 'Creating log analytics workspace...');
        progress.report({ message: creating });

        context.logAnalyticsWorkspace = await opClient.workspaces.beginCreateOrUpdateAndWait(
            nonNullProp(resourceGroup, 'name'), workspaceName, { location: (await LocationListStep.getLocation(context)).name });

        const created: string = localize('createdLogAnalyticsWorkspace', 'Created log analytics workspace "{0}".', workspaceName);
        ext.outputChannel.appendLog(created);

        if (context.activityChildren) {
            context.activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createContextValue(['logAnalyticsCreateStep', workspaceName, activitySuccessContext, randomUUID()]),
                    label: localize('createWorkspace', 'Create log analytics workspace "{0}"', workspaceName),
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );
        }
    }

    public shouldExecute(context: IManagedEnvironmentContext): boolean {
        return !context.logAnalyticsWorkspace;
    }
}
