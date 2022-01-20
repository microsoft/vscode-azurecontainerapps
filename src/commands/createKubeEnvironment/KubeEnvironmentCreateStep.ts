/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementClient } from "@azure/arm-appservice";
import { Progress } from "vscode";
import { AzureWizardExecuteStep, LocationListStep } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { createOperationalInsightsManagementClient, createWebSiteClient } from '../../utils/azureClients';
import { getResourceGroupFromId } from "../../utils/azureUtils";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValueAndProp } from "../../utils/nonNull";
import { IKubeEnvironmentContext } from "./IKubeEnvironmentContext";

export class KubeEnvironmentCreateStep extends AzureWizardExecuteStep<IKubeEnvironmentContext> {
    public priority: number = 250;

    public async execute(context: IKubeEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: WebSiteManagementClient = await createWebSiteClient(context);
        const opClient = createOperationalInsightsManagementClient(context);
        const rgName = nonNullValueAndProp(context.resourceGroup, 'name');
        const logAnalyticsWorkspace = nonNullProp(context, 'logAnalyticsWorkspace');

        const creatingKuEnv: string = localize('creatingKubeEnvironment', 'Creating new Container App environment "{0}"...', context.newKubeEnvironmentName);
        progress.report({ message: creatingKuEnv });
        ext.outputChannel.appendLog(creatingKuEnv);

        const sharedKeys = await opClient.sharedKeysOperations.getSharedKeys(
            getResourceGroupFromId(nonNullProp(logAnalyticsWorkspace, 'id')),
            nonNullProp(logAnalyticsWorkspace, 'name'));

        context.kubeEnvironment = await client.kubeEnvironments.beginCreateOrUpdateAndWait(rgName, nonNullProp(context, 'newKubeEnvironmentName'),
            {
                location: (await LocationListStep.getLocation(context)).name,
                environmentType: 'Managed',
                appLogsConfiguration: {
                    "destination": "log-analytics",
                    "logAnalyticsConfiguration": {
                        "customerId": nonNullProp(context, 'logAnalyticsWorkspace').customerId,
                        "sharedKey": sharedKeys.primarySharedKey
                    }
                }
            }
        );
    }

    public shouldExecute(context: IKubeEnvironmentContext): boolean {
        return !context.kubeEnvironment;
    }
}
