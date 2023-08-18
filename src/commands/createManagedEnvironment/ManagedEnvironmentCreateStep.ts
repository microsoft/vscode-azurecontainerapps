/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, LocationListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericTreeItem } from "@microsoft/vscode-azext-utils";
import { Progress, ThemeColor, ThemeIcon } from "vscode";
import { activitySuccessContext, managedEnvironmentsAppProvider } from "../../constants";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient, createOperationalInsightsManagementClient } from '../../utils/azureClients';
import { createActivityChildContext } from "../../utils/createContextWithRandomUUID";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValueAndProp } from "../../utils/nonNull";
import { IManagedEnvironmentContext } from "./IManagedEnvironmentContext";

export class ManagedEnvironmentCreateStep extends AzureWizardExecuteStep<IManagedEnvironmentContext> {
    public priority: number = 250;

    public async execute(context: IManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
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

        const created: string = localize('createdManagedEnvironment', 'Created new container apps environment "{0}".', context.newManagedEnvironmentName);
        ext.outputChannel.appendLog(created);

        if (context.activityChildren) {
            context.activityChildren.push(
                new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(context.activityChildren.length, ['managedEnvironmentCreateStep', managedEnvironmentName, activitySuccessContext]),
                    label: localize('createManagedEnvironment', 'Create container apps environment "{0}"', managedEnvironmentName),
                    iconPath: new ThemeIcon('pass', new ThemeColor('testing.iconPassed'))
                })
            );
        } else {
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
}
