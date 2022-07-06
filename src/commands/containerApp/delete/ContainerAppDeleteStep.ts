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

export class ContainerAppDeleteStep extends AzureWizardExecuteStep<IDeleteWizardContext> {
    public priority: number = 100;

    public async execute(context: IDeleteWizardContext, _progress: Progress<{ message?: string; increment?: number }>): Promise<void> {
        const node = context.node;
        const deleting: string = localize('deletingContainerApp', 'Deleting container app "{0}"...', node.name);
        const deleteSucceeded: string = localize('deletedContainerApp', 'Successfully deleted container app "{0}".', node.name);

        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, node.subscriptionContext]);
            await deleteUtil(async () => {
                await webClient.containerApps.beginDeleteAndWait(node.resourceGroupName, node.name);
            });

            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public shouldExecute(_wizardContext: IDeleteWizardContext): boolean {
        return true;
    }
}
