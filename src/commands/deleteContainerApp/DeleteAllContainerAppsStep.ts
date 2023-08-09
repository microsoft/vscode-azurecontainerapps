/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, parseError } from "@microsoft/vscode-azext-utils";
import { Progress } from "vscode";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { IDeleteContainerAppWizardContext } from "./IDeleteContainerAppWizardContext";

export class DeleteAllContainerAppsStep extends AzureWizardExecuteStep<IDeleteContainerAppWizardContext> {
    public priority: number = 100;

    public async execute(context: IDeleteContainerAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const containerAppNames: string[] = Array.isArray(context.containerAppNames) ? context.containerAppNames : [context.containerAppNames];
        const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, context.subscription]);

        for (const containerAppName of containerAppNames) {
            try {
                const deleting: string = localize('deletingContainerApp', 'Deleting container app "{0}"...', containerAppName);
                const deleted: string = localize('deletedContainerApp', 'Deleted container app "{0}".', containerAppName);

                progress.report({ message: deleting });
                await webClient.containerApps.beginDeleteAndWait(context.resourceGroupName, containerAppName);

                ext.outputChannel.appendLog(deleted);
            } catch (error) {
                const pError = parseError(error);
                // a 204 indicates a success, but sdk is catching it as an exception
                // accept any 2xx reponse code
                if (Number(pError.errorType) < 200 || Number(pError.errorType) >= 300) {
                    throw error;
                }
            }
        }
    }

    public shouldExecute(context: IDeleteContainerAppWizardContext): boolean {
        return !!context.containerAppNames?.length;
    }
}
