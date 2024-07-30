/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { ManagedEnvironmentNameStep } from "../../createManagedEnvironment/ManagedEnvironmentNameStep";
import { RegistryNameStep } from "../../registries/createAcr/RegistryNameStep";
import { type DeployWorkspaceProjectInternalContext } from "./DeployWorkspaceProjectInternalContext";
import { sanitizeResourceName } from "./sanitizeResourceName";

/** Names any app environment shared resources: `resource group`, `managed environment`, `container registry` */
export class SharedResourcesNameStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async configureBeforePrompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        if ((context.resourceGroup || context.managedEnvironment) && !context.registry) {
            // Generate a new name automatically without prompting
            context.newRegistryName = await RegistryNameStep.generateRelatedName(context, context.managedEnvironment?.name || nonNullValueAndProp(context.resourceGroup, 'name'));
        }
    }

    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        const resourceName: string = (await context.ui.showInputBox({
            prompt: localize('sharedNamePrompt', 'Enter a name for the container app environment'),
            value: sanitizeResourceName(context.rootFolder?.name ?? ''),
            validateInput: (name: string) => this.validateInput(context, name),
            asyncValidationTask: (name: string) => this.validateNameAvailability(context, name)
        })).trim();

        ext.outputChannel.appendLog(localize('usingSharedName', 'User provided the name "{0}" for the container app environment.', resourceName));

        !context.resourceGroup && (context.newResourceGroupName = resourceName);
        !context.managedEnvironment && (context.newManagedEnvironmentName = resourceName);
        !context.registry && (context.newRegistryName = await RegistryNameStep.generateRelatedName(context, resourceName));
    }

    public shouldPrompt(context: DeployWorkspaceProjectInternalContext): boolean {
        return (!context.resourceGroup && !context.newResourceGroupName) ||
            (!context.managedEnvironment && !context.newManagedEnvironmentName);
    }

    private validateInput(context: DeployWorkspaceProjectInternalContext, name: string = ''): string | undefined {
        name = name.trim();

        if (!context.managedEnvironment && !context.newManagedEnvironmentName) {
            const result = ManagedEnvironmentNameStep.validateInput(name);
            if (result) {
                return result;
            }
        }

        if (!context.registry) {  // Skip checking newRegistryName since it gets set every time validateNameAvailability is run
            // No symbols are allowed for ACR names
            const nameWithoutSymbols: string = name.replace(/[^a-z0-9]+/g, '');
            const result = RegistryNameStep.validateInput(nameWithoutSymbols);
            if (result) {
                return result;
            }
        }

        return undefined;
    }

    protected async validateNameAvailability(context: DeployWorkspaceProjectInternalContext, name: string): Promise<string | undefined> {
        return await window.withProgress({
            location: ProgressLocation.Notification,
            cancellable: false,
            title: localize('verifyingAvailabilityTitle', 'Verifying resource name availability...')
        }, async () => {
            const resourceNameUnavailable: string = localize('resourceNameUnavailable', 'Resource name "{0}" is unavailable.', name);

            const resourceGroupAvailable: boolean = !!context.resourceGroup || await ResourceGroupListStep.isNameAvailable(context, name);
            if (!resourceGroupAvailable) {
                return `Resource group: ${resourceNameUnavailable}`;
            }

            if (context.resourceGroup) {
                const managedEnvironmentAvailable: boolean = !!context.managedEnvironment || await ManagedEnvironmentNameStep.isNameAvailable(context, name, name);
                if (!managedEnvironmentAvailable) {
                    return `Container apps environment: ${resourceNameUnavailable}`;
                }
            } else {
                // Skip check - new resource group means unique managed environment
            }

            return undefined;
        });
    }
}
