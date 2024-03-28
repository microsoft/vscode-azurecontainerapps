/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

export class TryUseExistingRegistryStep extends AzureWizardExecuteStep<DeployWorkspaceProjectInternalContext> {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    public async execute(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);

        let resourceGroupRegistry: Registry | undefined;
        let registry: Registry | undefined;

        for (const r of registries) {
            if (!r.id) {
                continue;
            }

            if (parseAzureResourceId(r.id).resourceGroup === context.resourceGroup?.name) {
                resourceGroupRegistry = r;
                break;
            }

            if (!registry) {
                registry = r;
            }
        }

        context.registry = resourceGroupRegistry || registry;
    }

    public shouldExecute(context: DeployWorkspaceProjectInternalContext): boolean {
        return !context.registry;
    }
}
