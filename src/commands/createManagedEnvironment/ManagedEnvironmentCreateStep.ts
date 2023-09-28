/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { GenericTreeItem } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, managedEnvironmentsAppProvider } from "../../constants";
import { createActivityChildContext } from "../../utils/activity/activityUtils";
import { ExecuteActivityOutput, ExecuteActivityOutputStepBase } from "../../utils/activity/ExecuteActivityOutputStepBase";
import { createContainerAppsAPIClient, createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValueAndProp } from "../../utils/nonNull";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export class ManagedEnvironmentCreateStep extends ExecuteActivityOutputStepBase<IManagedEnvironmentContext> {
    public priority: number = 250;

    protected async executeCore(context: IManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
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
    }

    public shouldExecute(context: IManagedEnvironmentContext): boolean {
        return !context.managedEnvironment;
    }

    protected initSuccessOutput(context: IManagedEnvironmentContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['managedEnvironmentCreateStep', activitySuccessContext]),
                label: localize('createManagedEnvironment', 'Create container apps environment "{0}"', context.newManagedEnvironmentName),
                iconPath: activitySuccessIcon
            }),
            output: localize('createdManagedEnvironmentSuccess', 'Created container apps environment "{0}".', context.newManagedEnvironmentName)
        };
    }

    protected initFailOutput(context: IManagedEnvironmentContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['managedEnvironmentCreateStep', activityFailContext]),
                label: localize('createManagedEnvironment', 'Create container apps environment "{0}"', context.newManagedEnvironmentName),
                iconPath: activityFailIcon
            }),
            output: localize('createdManagedEnvironmentFail', 'Failed to create container apps environment "{0}".', context.newManagedEnvironmentName)
        };
    }
}
