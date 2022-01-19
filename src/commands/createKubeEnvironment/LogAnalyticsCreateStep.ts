/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Progress } from "vscode";
import { AzureWizardExecuteStep } from "vscode-azureextensionui";
import { createOperationalInsightsManagementClient } from "../../utils/azureClients";
import { nonNullProp, nonNullValue } from "../../utils/nonNull";
import { IKubeEnvironmentContext } from "./IKubeEnvironmentContext";

export class LogAnalyticsCreateStep extends AzureWizardExecuteStep<IKubeEnvironmentContext> {
    public priority: number = 200;

    public async execute(context: IKubeEnvironmentContext, _progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const opClient = createOperationalInsightsManagementClient(context);
        const rg = nonNullValue(context.resourceGroup);
        context.logAnalyticsWorkspace = await opClient.workspaces.beginCreateOrUpdateAndWait(
            nonNullProp(rg, 'name'), nonNullProp(context, 'newKubeEnvironmentName'), { location: rg.location });
    }

    public shouldExecute(context: IKubeEnvironmentContext): boolean {
        return !context.logAnalyticsWorkspace;
    }
}
