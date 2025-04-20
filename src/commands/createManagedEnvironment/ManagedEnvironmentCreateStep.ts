/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { managedEnvironmentsAppProvider } from "../../constants";
import { createContainerAppsAPIClient, createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValueAndProp } from "../../utils/nonNull";
import { type ManagedEnvironmentCreateContext } from "./ManagedEnvironmentCreateContext";

export class ManagedEnvironmentCreateStep<T extends ManagedEnvironmentCreateContext> extends AzureWizardExecuteStep<T> {
    public priority: number = 250;
    public stepName: string = 'managedEnvironmentCreateStep';
    protected getOutputLogSuccess = (context: T): string => localize('createdManagedEnvironmentSuccess', 'Successfully created container apps environment "{0}".', context.newManagedEnvironmentName);
    protected getOutputLogFail = (context: T): string => localize('createdManagedEnvironmentFail', 'Failed to create container apps environment "{0}".', context.newManagedEnvironmentName);
    protected getTreeItemLabel = (context: T): string => localize('createManagedEnvironment', 'Create container apps environment "{0}"', context.newManagedEnvironmentName);

    public async execute(context: T, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient(context);
        const opClient = await createOperationalInsightsManagementClient(context);

        const resourceGroupName = nonNullValueAndProp(context.resourceGroup, 'name');
        const managedEnvironmentName = nonNullProp(context, 'newManagedEnvironmentName');
        const logAnalyticsWorkspace = nonNullProp(context, 'logAnalyticsWorkspace');

        const creating: string = localize('creatingManagedEnvironment', 'Creating environment...');
        progress.report({ message: creating });

        const sharedKeys = await opClient.sharedKeysOperations.getSharedKeys(
            getResourceGroupFromId(nonNullProp(logAnalyticsWorkspace, 'id')),
            nonNullProp(logAnalyticsWorkspace, 'name'));

        context.managedEnvironment = await client.managedEnvironments.beginCreateOrUpdateAndWait(resourceGroupName, managedEnvironmentName,
            {
                location: (await LocationListStep.getLocation(context)).name,
                appLogsConfiguration: {
                    "destination": "log-analytics",
                    "logAnalyticsConfiguration": {
                        "customerId": logAnalyticsWorkspace.customerId,
                        "sharedKey": sharedKeys.primarySharedKey
                    }
                },
                workloadProfiles: [
                    {
                        name: "Consumption",
                        workloadProfileType: "Consumption"
                    }
                ]
            }
        );

        if (!context.activityChildren) {
            context.activityResult = {
                id: nonNullProp(context.managedEnvironment, 'id'),
                name: managedEnvironmentName,
                type: managedEnvironmentsAppProvider
            };
        }
    }

    public shouldExecute(context: T): boolean {
        return !context.managedEnvironment;
    }
}
