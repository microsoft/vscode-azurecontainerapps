/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep, parseError } from "@microsoft/vscode-azext-utils";
import { window } from "vscode";
import { ext } from "../../extensionVariables";
import { createContainerAppsAPIClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { IDeleteContainerAppWizardContext } from "./IDeleteContainerAppWizardContext";

export class DeleteContainerAppStep extends AzureWizardExecuteStep<IDeleteContainerAppWizardContext> {
    public priority: number = 100;

    public async execute(context: IDeleteContainerAppWizardContext): Promise<void> {
        const deleting: string = localize('deletingContainerApp', 'Deleting Container App "{0}"...', context.containerApp.name);
        const deleteSucceeded: string = localize('deletedContainerApp', 'Successfully deleted Container App "{0}".', context.containerApp.name);
        const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, context.containerApp]);

        try {
            ext.outputChannel.appendLog(deleting);
            await webClient.containerApps.beginDeleteAndWait(context.containerApp.resourceGroupName, context.containerApp.name);
        } catch (error) {
            const pError = parseError(error);
            // a 204 indicates a success, but sdk is catching it as an exception
            // accept any 2xx reponse code
            if (Number(pError.errorType) < 200 || Number(pError.errorType) >= 300) {
                throw error;
            }
        }
        void window.showInformationMessage(deleteSucceeded);
        ext.outputChannel.appendLog(deleteSucceeded);
    }

    public shouldExecute(): boolean {
        return true;
    }
}
