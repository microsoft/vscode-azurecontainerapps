/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { validateUtils } from "../../../utils/validateUtils";
import { ContainerAppNameStep } from "../../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../../createManagedEnvironment/ManagedEnvironmentNameStep";
import { ImageNameStep } from "../../image/imageSource/buildImageInAzure/ImageNameStep";
import { RegistryNameStep } from "../../image/imageSource/containerRegistry/acr/createAcr/RegistryNameStep";
import type { DeployWorkspaceProjectContext } from "../DeployWorkspaceProjectContext";

export class DefaultResourcesNameStep extends AzureWizardPromptStep<DeployWorkspaceProjectContext> {
    public async prompt(context: DeployWorkspaceProjectContext): Promise<void> {
        ext.outputChannel.appendLog(localize('resourceNameUnavailable',
            'Info: Some container app resources matching the workspace name "{0}" were invalid or unavailable.',
            cleanWorkspaceName(nonNullValueAndProp(context.rootFolder, 'name')))
        );

        const resourceBaseName: string = (await context.ui.showInputBox({
            prompt: localize('resourceBaseNamePrompt', 'Enter a name for the new container app resource(s).'),
            validateInput: this.validateInput,
            asyncValidationTask: (name: string) => this.validateNameAvailability(context, name)
        })).trim();

        ext.outputChannel.appendLog(localize('usingResourceName', 'User provided the new resource name "{0}" as the default for resource creation.', resourceBaseName))

        !context.resourceGroup && (context.newResourceGroupName = resourceBaseName);
        !context.managedEnvironment && (context.newManagedEnvironmentName = resourceBaseName);
        !context.containerApp && (context.newContainerAppName = resourceBaseName);
        context.imageName = ImageNameStep.getTimestampedImageName(context.containerApp?.name || resourceBaseName);
    }

    public async configureBeforePrompt(context: DeployWorkspaceProjectContext): Promise<void> {
        const workspaceName: string = cleanWorkspaceName(nonNullValueAndProp(context.rootFolder, 'name'));
        if (this.validateInput(workspaceName) !== undefined) {
            context.telemetry.properties.promptDefaultNameReason = 'invalid';
            return;
        }

        if (!await this.isWorkspaceNameAvailable(context, workspaceName)) {
            context.telemetry.properties.promptDefaultNameReason = 'unavailable';
            return;
        }

        if (!context.resourceGroup || !context.managedEnvironment || !context.registry || !context.containerApp) {
            ext.outputChannel.appendLog(localize('usingWorkspaceName', 'Using workspace name "{0}" as the default for remaining resource creation.', workspaceName));
        }

        !context.resourceGroup && (context.newResourceGroupName = workspaceName);
        !context.managedEnvironment && (context.newManagedEnvironmentName = workspaceName);
        !context.registry && (context.newRegistryName = await RegistryNameStep.tryGenerateRelatedName(context, workspaceName));
        !context.containerApp && (context.newContainerAppName = workspaceName);
        context.imageName = ImageNameStep.getTimestampedImageName(context.containerApp?.name || workspaceName);
    }

    public shouldPrompt(context: DeployWorkspaceProjectContext): boolean {
        return (!context.resourceGroup && !context.newResourceGroupName) ||
            (!context.managedEnvironment && !context.newManagedEnvironmentName) ||
            (!context.registry && !context.newRegistryName) ||
            (!context.containerApp && !context.newContainerAppName);
    }

    private validateInput(name: string | undefined): string | undefined {
        name ??= '';

        // No symbols are allowed for ACR - we will strip out any offending characters from the base name, but still need to ensure this version has an appropriate length
        const nameWithoutSymbols: string = name.replace(/[^a-z0-9]+/g, '');
        if (!validateUtils.isValidLength(nameWithoutSymbols, 5, 20)) {
            return localize('invalidLength', 'The alphanumeric portion of the name must be least 5 characters but no more than 20 characters.');
        }

        const symbols: string = '-';
        if (!validateUtils.isLowerCaseAlphanumericWithSymbols(name, symbols, false /** canSymbolsRepeat */)) {
            return validateUtils.getInvalidLowerCaseAlphanumericWithSymbolsMessage(symbols);
        }

        return undefined;
    }

    protected async validateNameAvailability(context: DeployWorkspaceProjectContext, name: string): Promise<string | undefined> {
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

    protected async isWorkspaceNameAvailable(context: DeployWorkspaceProjectContext, workspaceName: string): Promise<boolean> {
        const isAvailable: Record<string, boolean> = {};

        if (context.resourceGroup || await ResourceGroupListStep.isNameAvailable(context, workspaceName)) {
            isAvailable['resourceGroup'] = true;
        }

        if (context.managedEnvironment || await ManagedEnvironmentNameStep.isNameAvailable(context, workspaceName, workspaceName)) {
            isAvailable['managedEnvironment'] = true;
        }

        if (context.containerApp || await ContainerAppNameStep.isNameAvailable(context, workspaceName, workspaceName)) {
            isAvailable['containerApp'] = true;
        }

        return isAvailable['resourceGroup'] && isAvailable['managedEnvironment'] && isAvailable['containerApp'];
    }
}

export function cleanWorkspaceName(workspaceName: string): string {
    // Only alphanumeric characters or hyphens
    let cleanedWorkspaceName: string = workspaceName.toLowerCase().replace(/[^a-z0-9-]+/g, '');

    // Remove any consecutive hyphens
    cleanedWorkspaceName = cleanedWorkspaceName.replace(/-+/g, '-');

    // Remove any leading or ending hyphens
    if (cleanedWorkspaceName.startsWith('-')) {
        cleanedWorkspaceName = cleanedWorkspaceName.slice(1);
    }
    if (cleanedWorkspaceName.endsWith('-')) {
        cleanedWorkspaceName = cleanedWorkspaceName.slice(0, -1);
    }

    return cleanedWorkspaceName;
}
