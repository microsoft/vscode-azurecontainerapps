/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, parseError } from "@microsoft/vscode-azext-utils";
import { Progress, window } from "vscode";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { IDeleteManagedEnvironmentWizardContext } from "./IDeleteManagedEnvironmentWizardContext";

export class DeleteManagedEnvironmentStep extends AzureWizardExecuteStep<IDeleteManagedEnvironmentWizardContext> {
    public priority: number = 110;

    public async execute(context: IDeleteManagedEnvironmentWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const deleting: string = localize('deletingManagedEnv', 'Deleting Container Apps environment "{0}"...', context.managedEnvironmentName);
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, context.subscription]);

        try {
            ext.outputChannel.appendLog(deleting);
            progress.report({ message: deleting });
            await client.managedEnvironments.beginDeleteAndWait(context.resourceGroupName, context.managedEnvironmentName);
        } catch (error) {
            const pError = parseError(error);
            // a 204 indicates a success, but sdk is catching it as an exception:
            // Received unexpected HTTP status code 204 while polling. This may indicate a server issue.
            if (Number(pError.errorType) < 200 || Number(pError.errorType) >= 300) {
                throw error;
            }
        }

        const deleteSucceeded: string = localize('deleteManagedEnvSucceeded', 'Successfully deleted Container Apps environment "{0}".', context.managedEnvironmentName);
        void window.showInformationMessage(deleteSucceeded);
        ext.outputChannel.appendLog(deleteSucceeded);
    }

    public shouldExecute(context: IDeleteManagedEnvironmentWizardContext): boolean {
        return !!context.managedEnvironmentName && !!context.resourceGroupName && !!context.subscription;
    }
}
