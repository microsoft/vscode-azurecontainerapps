/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, parseError } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { type IDeleteManagedEnvironmentContext } from "./IDeleteManagedEnvironmentContext";

export class DeleteManagedEnvironmentStep extends AzureWizardExecuteStep<IDeleteManagedEnvironmentContext> {
    public priority: number = 110;

    public async execute(context: IDeleteManagedEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, context.subscription]);

        const deleting: string = localize('deletingManagedEnv', 'This may take several minutes...');
        progress.report({ message: deleting });

        try {
            await client.managedEnvironments.beginDeleteAndWait(context.resourceGroupName, context.managedEnvironmentName);
        } catch (error) {
            const pError = parseError(error);
            // a 204 indicates a success, but sdk is catching it as an exception:
            // Received unexpected HTTP status code 204 while polling. This may indicate a server issue.
            if (Number(pError.errorType) < 200 || Number(pError.errorType) >= 300) {
                throw error;
            }
        }

        const deleted: string = localize('deletedManagedEnv', 'Deleted container apps environment "{0}".', context.managedEnvironmentName);
        ext.outputChannel.appendLog(deleted);
    }

    public shouldExecute(context: IDeleteManagedEnvironmentContext): boolean {
        return !!context.managedEnvironmentName && !!context.resourceGroupName;
    }
}
