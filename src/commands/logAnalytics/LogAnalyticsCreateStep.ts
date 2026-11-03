/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep } from '@microsoft/vscode-azext-azureutils';
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp, nonNullValueAndProp } from '@microsoft/vscode-azext-utils';
import { type Progress } from 'vscode';
import { createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { localize } from '../../utils/localize';
import { type LogAnalyticsContext } from './LogAnalyticsContext';

export class LogAnalyticsCreateStep extends AzureWizardExecuteStepWithActivityOutput<LogAnalyticsContext> {
    public priority: number = 220;
    public stepName: string = 'logAnalyticsCreateStep';
    protected getOutputLogSuccess = (context: LogAnalyticsContext): string => localize('createLogAnalyticsWorkspaceSuccess', 'Successfully created Log Analytics workspace "{0}".', context.newLogAnalyticsWorkspaceName);
    protected getOutputLogFail = (context: LogAnalyticsContext): string => localize('createLogAnalyticsWorkspaceFail', 'Failed to create Log Analytics workspace "{0}".', context.newLogAnalyticsWorkspaceName);
    protected getTreeItemLabel = (context: LogAnalyticsContext): string => localize('createWorkspace', 'Create log analytics workspace "{0}"', context.newLogAnalyticsWorkspaceName);

    public async execute(context: LogAnalyticsContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        progress.report({ message: localize('creatingLogAnalyticsWorkspace', 'Creating Log Analytics workspace...') });
        const client = await createOperationalInsightsManagementClient(context);
        context.logAnalyticsWorkspace = await client.workspaces.beginCreateOrUpdateAndWait(
            nonNullValueAndProp(context.resourceGroup, 'name'),
            nonNullProp(context, 'newLogAnalyticsWorkspaceName'),
            { location: (await LocationListStep.getLocation(context)).name },
        );
    }

    public shouldExecute(context: LogAnalyticsContext): boolean {
        return !context.logAnalyticsWorkspace;
    }
}
