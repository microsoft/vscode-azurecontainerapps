/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Registry } from "@azure/arm-containerregistry";
import { parseAzureResourceId } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { ext } from "../../../../extensionVariables";
import { type SetTelemetryProps } from "../../../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectInternalTelemetryProps as TelemetryProps } from "../../../../telemetry/deployWorkspaceProjectTelemetryProps";
import { localize } from "../../../../utils/localize";
import { AcrListStep } from "../../../image/imageSource/containerRegistry/acr/AcrListStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

type TryUseExistingRegistryContext = DeployWorkspaceProjectInternalContext & SetTelemetryProps<TelemetryProps>;

export class TryUseExistingRegistryStep<T extends TryUseExistingRegistryContext> extends AzureWizardExecuteStep<T> {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    public async execute(context: T): Promise<void> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);

        let registryInSameResourceGroup: Registry | undefined;
        let registry: Registry | undefined;

        for (const r of registries) {
            if (!r.id) {
                continue;
            }

            if (parseAzureResourceId(r.id).resourceGroup === context.resourceGroup?.name) {
                registryInSameResourceGroup = r;
                break;
            }

            if (!registry) {
                registry = r;

                if (!context.resourceGroup) {
                    break;
                }
            }
        }

        if (registryInSameResourceGroup) {
            ext.outputChannel.appendLog(localize('resourceGroupRegistry', 'Found an available registry "{0}" in the provided resource group "{1}".', registryInSameResourceGroup.name, context.resourceGroup?.name));
        } else if (registry) {
            ext.outputChannel.appendLog(localize('firstRegistry', 'Found an available registry "{0}" in the provided subscription.', registry.name));
        }

        // Prioritize trying to find a registry in the same resource group
        // Otherwise, just use the first available registry
        context.registry = registryInSameResourceGroup || registry;
        context.telemetry.properties.defaultedRegistryInternal = context.registry ? 'true' : 'false';
    }

    public shouldExecute(context: T): boolean {
        return !context.registry;
    }
}
