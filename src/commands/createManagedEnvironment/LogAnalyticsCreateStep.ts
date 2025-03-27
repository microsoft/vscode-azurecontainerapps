/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardStepWithActivityOutput } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp } from "../../utils/nonNull";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";

export class LogAnalyticsCreateStep<T extends ManagedEnvironmentCreateContext> extends AzureWizardStepWithActivityOutput<T> {
    public priority: number = 220;
    public stepName: string = 'logAnalyticsCreateStep';
    protected getSuccessString = (context: T) => localize('createLogAnalyticsSuccess', 'Successfully created log analytics workspace "{0}"', context.newLogAnalyticsWorkspaceName || nonNullProp(context, 'newManagedEnvironmentName'));
    protected getFailString = (context: T) => localize('createLogAnalyticsFail', 'Failed to create log analytics workspace "{0}"', context.newLogAnalyticsWorkspaceName || nonNullProp(context, 'newManagedEnvironmentName'));
    protected getTreeItemLabel = (context: T) => localize('createLogAnalyticsLabel', 'Create log analytics workspace "{0}"', context.newLogAnalyticsWorkspaceName || nonNullProp(context, 'newManagedEnvironmentName'));

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('creatingLogAnalyticsWorkspace', 'Creating log analytics workspace...') });

        const opClient = await createOperationalInsightsManagementClient(context);
        const resourceGroup = nonNullProp(context, 'resourceGroup');
        const workspaceName = context.newLogAnalyticsWorkspaceName || nonNullProp(context, 'newManagedEnvironmentName');

        context.logAnalyticsWorkspace = await opClient.workspaces.beginCreateOrUpdateAndWait(
            nonNullProp(resourceGroup, 'name'), workspaceName, { location: (await LocationListStep.getLocation(context)).name });
    }

    public shouldExecute(context: T): boolean {
        return !context.logAnalyticsWorkspace;
    }
}
