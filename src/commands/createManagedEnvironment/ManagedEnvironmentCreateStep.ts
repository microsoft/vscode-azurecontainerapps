/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { Progress, window } from "vscode";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient, createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { getResourceGroupFromId } from "../../utils/azureUtils";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValueAndProp } from "../../utils/nonNull";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export class ManagedEnvironmentCreateStep extends AzureWizardExecuteStep<IManagedEnvironmentContext> {
    public priority: number = 250;

    public async execute(context: IManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const opClient = await createOperationalInsightsManagementClient(context);
        const rgName = nonNullValueAndProp(context.resourceGroup, 'name');
        const logAnalyticsWorkspace = nonNullProp(context, 'logAnalyticsWorkspace');

        const creatingKuEnv: string = localize('creatingManagedEnvironment', 'Creating new Container Apps environment "{0}"...', context.newManagedEnvironmentName);
        progress.report({ message: creatingKuEnv });
        ext.outputChannel.appendLog(creatingKuEnv);

        const sharedKeys = await opClient.sharedKeysOperations.getSharedKeys(
            getResourceGroupFromId(nonNullProp(logAnalyticsWorkspace, 'id')),
            nonNullProp(logAnalyticsWorkspace, 'name'));

        context.managedEnvironment = await client.managedEnvironments.beginCreateOrUpdateAndWait(rgName, nonNullProp(context, 'newManagedEnvironmentName'),
            {
                location: (await LocationListStep.getLocation(context)).name,
                appLogsConfiguration: {
                    "destination": "log-analytics",
                    "logAnalyticsConfiguration": {
                        "customerId": nonNullProp(context, 'logAnalyticsWorkspace').customerId,
                        "sharedKey": sharedKeys.primarySharedKey
                    }
                }
            }
        );

        const createdKuEnv: string = localize('createKuEnv', 'Successfully created new Container Apps environment "{0}".', context.newManagedEnvironmentName);
        ext.outputChannel.appendLog(createdKuEnv);
        void window.showInformationMessage(createdKuEnv);
    }

    public shouldExecute(context: IManagedEnvironmentContext): boolean {
        return !context.managedEnvironment;
    }
}
