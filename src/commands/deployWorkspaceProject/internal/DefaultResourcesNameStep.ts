/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { ContainerAppNameStep } from "../../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../../createManagedEnvironment/ManagedEnvironmentNameStep";
import { ImageNameStep } from "../../image/imageSource/buildImageInAzure/ImageNameStep";
import { RegistryNameStep } from "../../image/imageSource/containerRegistry/acr/createAcr/RegistryNameStep";
import { type DeployWorkspaceProjectInternalContext } from "./deployWorkspaceProjectInternal";

export class DefaultResourcesNameStep extends AzureWizardPromptStep<DeployWorkspaceProjectInternalContext> {
    public async prompt(context: DeployWorkspaceProjectInternalContext): Promise<void> {
        const resourceName: string = (await context.ui.showInputBox({
            prompt: localize('resourceBaseNamePrompt', 'Enter a name for the new container app resource(s).'),
            validateInput: (name: string) => this.validateInput(context, name),
            asyncValidationTask: (name: string) => this.validateNameAvailability(context, name)
        })).trim();

        ext.outputChannel.appendLog(localize('usingResourceName', 'User provided the new resource name "{0}" as the default for resource creation.', resourceName))

        !context.resourceGroup && (context.newResourceGroupName = resourceName);
        !context.managedEnvironment && (context.newManagedEnvironmentName = resourceName);
        !context.containerApp && (context.newContainerAppName = resourceName);
        context.imageName = ImageNameStep.getTimestampedImageName(context.containerApp?.name || resourceName);
    }

    public shouldPrompt(context: DeployWorkspaceProjectInternalContext): boolean {
        return (!context.resourceGroup && !context.newResourceGroupName) ||
            (!context.managedEnvironment && !context.newManagedEnvironmentName) ||
            (!context.registry && !context.newRegistryName) ||
            (!context.containerApp && !context.newContainerAppName);
    }

    private validateInput(context: DeployWorkspaceProjectInternalContext, name: string = ''): string | undefined {
        name = name.trim();

        // ** Sorted from most to least strict naming rules, with priority being most strict character length since that usually gets checked first **
        // ** This sorting should help to minimize showing conflicting validate input error messages which could be potentially confusing for users **

        if (!context.managedEnvironment && !context.newManagedEnvironmentName) {
            const result = ManagedEnvironmentNameStep.validateInput(name);
            if (result) {
                return result;
            }
        }

        if (!context.containerApp && !context.newContainerAppName) {
            const result = ContainerAppNameStep.validateInput(name);
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

            if (context.registry) {
                // Skip check, one already exists so don't need to worry about naming
            } else {
                context.newRegistryName = await RegistryNameStep.tryGenerateRelatedName(context, name);
                if (!context.newRegistryName) {
                    return localize('timeoutError', 'Timed out waiting for registry name to be generated. Please try another name.');
                }
            }

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

            if (context.managedEnvironment) {
                const containerAppAvailable: boolean = !!context.containerApp || await ContainerAppNameStep.isNameAvailable(context, name, name);
                if (!containerAppAvailable) {
                    return `Container app: ${resourceNameUnavailable}`;
                }
            } else {
                // Skip check - new managed environment means unique container app
            }

            return undefined;
        });
    }
}
