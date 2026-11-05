/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { AzureWizardExecuteStepWithActivityOutput, nonNullProp } from '@microsoft/vscode-azext-utils';
import { type Progress } from 'vscode';
import { createContainerAppsAPIClient, createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { hasLogDestination } from '../../utils/hasLogDestination';
import { localize } from '../../utils/localize';
import { type LogAnalyticsContext } from './LogAnalyticsContext';

export class LogAnalyticsConnectStep extends AzureWizardExecuteStepWithActivityOutput<LogAnalyticsContext> {
    public priority: number = 260;
    public stepName: string = 'logAnalyticsConnectStep';
    protected getOutputLogSuccess = (context: LogAnalyticsContext): string => localize('connectLogAnalyticsSuccess', 'Successfully attached a Log Analytics workspace to environment "{0}".', context.managedEnvironment.name);
    protected getOutputLogFail = (context: LogAnalyticsContext): string => localize('connectLogAnalyticsFail', 'Failed to attach a Log Analytics workspace to environment "{0}".', context.managedEnvironment.name);
    protected getTreeItemLabel = (context: LogAnalyticsContext): string => localize('connectLogAnalyticsLabel', 'Attach log analytics workspace to environment "{0}"', context.managedEnvironment.name);

    public async execute(context: LogAnalyticsContext, progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        progress.report({ message: localize('connectingLogAnalytics', 'Attaching Log Analytics workspace...') });
        const client = await createContainerAppsAPIClient(context);
        const resourceGroupName = getResourceGroupFromId(nonNullProp(context.managedEnvironment, 'id'));
        const environmentName = nonNullProp(context.managedEnvironment, 'name');
        const environment = await client.managedEnvironments.get(resourceGroupName, environmentName);
        if (hasLogDestination(environment.appLogsConfiguration)) {
            throw new Error(localize('logsAlreadyConfigured', 'Logs are already configured for environment "{0}". Refresh the tree to open its logs.', environmentName));
        }

        const workspace = nonNullProp(context, 'logAnalyticsWorkspace');
        const workspaceClient = await createOperationalInsightsManagementClient(context);
        const sharedKeys = await workspaceClient.sharedKeysOperations.getSharedKeys(
            getResourceGroupFromId(nonNullProp(workspace, 'id')),
            nonNullProp(workspace, 'name'),
        );
        const sharedKey = nonNullProp(sharedKeys, 'primarySharedKey');
        context.valuesToMask.push(sharedKey);

        context.managedEnvironment = await client.managedEnvironments.update(
            resourceGroupName,
            environmentName,
            {
                location: context.managedEnvironment.location,
                appLogsConfiguration: {
                    destination: 'log-analytics',
                    logAnalyticsConfiguration: {
                        customerId: nonNullProp(workspace, 'customerId'),
                        sharedKey,
                    },
                },
            },
        );
    }

    public shouldExecute(context: LogAnalyticsContext): boolean {
        return !hasLogDestination(context.managedEnvironment.appLogsConfiguration);
    }
}
