/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from "vscode";
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValue } from "../../utils/nonNull";
import { IKubeEnvironmentContext } from "./IKubeEnvironmentContext";

export class LogAnalyticsCreateStep extends AzureWizardExecuteStep<IKubeEnvironmentContext> {
    public priority: number = 200;

    public async execute(context: IKubeEnvironmentContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const opClient = createOperationalInsightsManagementClient(context);
        const rg = nonNullValue(context.resourceGroup);

        const creatingLaw: string = localize('creatingLogAnalyticWorkspace', 'Creating new Log Analytic workspace...');
        progress.report({ message: creatingLaw });
        ext.outputChannel.appendLog(creatingLaw);
        context.logAnalyticsWorkspace = await opClient.workspaces.beginCreateOrUpdateAndWait(
            nonNullProp(rg, 'name'), nonNullProp(context, 'newKubeEnvironmentName'), { location: rg.location });
    }

    public shouldExecute(context: IKubeEnvironmentContext): boolean {
        return !context.logAnalyticsWorkspace;
    }
}
