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
import { AcrListStep } from "../../../registries/acr/AcrListStep";
import { type DeployWorkspaceProjectInternalContext } from "../DeployWorkspaceProjectInternalContext";

type TryUseExistingResourceGroupRegistryContext = DeployWorkspaceProjectInternalContext & SetTelemetryProps<TelemetryProps>;

export class TryUseExistingResourceGroupRegistryStep<T extends TryUseExistingResourceGroupRegistryContext> extends AzureWizardExecuteStep<T> {
    public priority: number = 200;  /** Todo: Figure out a good priority level */

    public async execute(context: T): Promise<void> {
        const registries: Registry[] = await AcrListStep.getRegistries(context);

        for (const r of registries) {
            if (!r.id) {
                continue;
            }

            if (parseAzureResourceId(r.id).resourceGroup === context.resourceGroup?.name) {
                context.registry = r;
                break;
            }
        }

        context.telemetry.properties.defaultedRegistryInternal = context.registry ? 'true' : 'false';

        if (context.registry) {
            ext.outputChannel.appendLog(localize('usingResourceGroupRegistry', 'Automatically using container registry "{0}" from resource group "{1}" provided.', context.registry.name, context.resourceGroup?.name));
        }
    }

    public shouldExecute(context: T): boolean {
        return !context.registry && !!context.resourceGroup;
    }
}
