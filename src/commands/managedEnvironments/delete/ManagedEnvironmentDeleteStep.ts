/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { Progress, ProgressLocation, window } from "vscode";
import { ext } from "../../../extensionVariables";
import { createContainerAppsAPIClient } from "../../../utils/azureClients";
import { deleteUtil } from "../../../utils/deleteUtil";
import { localize } from "../../../utils/localize";
import { IDeleteWizardContext } from "../../IDeleteWizardContext";

export class ManagedEnvironmentDeleteStep extends AzureWizardExecuteStep<IDeleteWizardContext> {
    public priority: number = 150;

    public async execute(context: IDeleteWizardContext, _progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        const node = context.node;
        const deleting: string = localize('DeletingManagedEnv', 'Deleting Container Apps environment "{0}"...', node.name);
        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, context.subscription]);
            await deleteUtil(async () => {
                ext.outputChannel.appendLog(deleting);
                await client.managedEnvironments.beginDeleteAndWait(node.resourceGroupName, node.name);
            });

            const deleteSucceeded: string = localize('DeleteManagedEnvSucceeded', 'Successfully deleted Container Apps environment "{0}".', node.name);
            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public shouldExecute(_wizardContext: IDeleteWizardContext): boolean {
        return true;
    }
}
