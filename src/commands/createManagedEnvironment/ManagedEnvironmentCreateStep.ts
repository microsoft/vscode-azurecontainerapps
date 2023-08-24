/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericTreeItem } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, managedEnvironmentsAppProvider } from "../../constants";
import { createActivityChildContext, ExecuteActivityOutput, tryCatchActivityWrapper } from "../../utils/activityUtils";
import { createContainerAppsAPIClient, createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValueAndProp } from "../../utils/nonNull";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export class ManagedEnvironmentCreateStep extends AzureWizardExecuteStep<IManagedEnvironmentContext> {
    public priority: number = 250;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: IManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.initSuccessOutput(context);
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
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
                        }
                    }
                );

                if (!context.activityChildren) {
                    context.activityResult = {
                        id: nonNullProp(context.managedEnvironment, 'id'),
                        name: managedEnvironmentName,
                        type: managedEnvironmentsAppProvider
                    };
                }
            },
            context, this.success, this.fail
        );
    }

    public shouldExecute(context: IManagedEnvironmentContext): boolean {
        return !context.managedEnvironment;
    }

    private initSuccessOutput(context: IManagedEnvironmentContext): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['managedEnvironmentCreateStep', activitySuccessContext]),
            label: localize('createManagedEnvironment', 'Create container apps environment "{0}"', context.newManagedEnvironmentName),
            iconPath: activitySuccessIcon
        });
        this.success.output = localize('createdManagedEnvironmentSuccess', 'Created new container apps environment "{0}".', context.newManagedEnvironmentName);
    }

    private initFailOutput(context: IManagedEnvironmentContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['managedEnvironmentCreateStep', activityFailContext]),
            label: localize('createManagedEnvironment', 'Create container apps environment "{0}"', context.newManagedEnvironmentName),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('createdManagedEnvironmentFail', 'Failed to create new container apps environment "{0}".', context.newManagedEnvironmentName);
    }
}
