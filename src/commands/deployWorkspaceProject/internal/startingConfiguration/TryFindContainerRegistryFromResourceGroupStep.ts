/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { type Progress } from "vscode";
import { ext } from "../../../../extensionVariables";
import { localize } from "../../../../utils/localize";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

export class TryFindContainerRegistryFromResourceGroupStep extends AzureWizardExecuteStep<DeployWorkspaceProjectInternalContext> {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    public async execute(context: DeployWorkspaceProjectInternalContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        progress.report({ message: localize('searchingRegistries', 'Searching for available registry...') });

        const registries: Registry[] = await AcrListStep.getRegistries(context);
        context.registry = registries.find(registry => {
            const resourceGroupName: string = parseAzureResourceId(nonNullProp(registry, 'id')).resourceGroup;
            return resourceGroupName === context.resourceGroup?.name;
        });

        if (context.registry) {
            ext.outputChannel.appendLog(localize('foundContainerRegistry', 'Found an available container registry "{0}" to use from resource group "{1}".', context.registry.name, context.resourceGroup?.name));
        }
    }

    public shouldExecute(context: DeployWorkspaceProjectInternalContext): boolean {
        return !!context.resourceGroup && !context.registry;
    }
}