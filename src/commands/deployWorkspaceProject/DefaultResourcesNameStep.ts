/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { validateUtils } from "../../utils/validateUtils";
import { ContainerAppNameStep } from "../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../createManagedEnvironment/ManagedEnvironmentNameStep";
import { RegistryNameStep } from "../deployImage/imageSource/containerRegistry/acr/createAcr/RegistryNameStep";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";

export class DefaultResourcesNameStep extends AzureWizardPromptStep<IDeployWorkspaceProjectContext> {
    public async prompt(context: IDeployWorkspaceProjectContext): Promise<void> {
        ext.outputChannel.appendLog(localize('resourceNameUnavailable',
            'Warning: Some container app resources matching the workspace name "{0}" were invalid or unavailable.',
            context.rootFolder?.name.replace(/[^a-zA-Z0-9]+/g, ''))
        );

        const resourceBaseName: string = (await context.ui.showInputBox({
            prompt: localize('resourceBaseNamePrompt', 'Enter a name for new container app resources.'),
            validateInput: this.validateInput,
            asyncValidationTask: (name: string) => this.validateNameAvailability(context, name)
        })).trim();

        // Set default names
        !context.resourceGroup && (context.newResourceGroupName = resourceBaseName);
        !context.managedEnvironment && (context.newManagedEnvironmentName = resourceBaseName);
        !context.registry && (context.newRegistryName = resourceBaseName.replace(/[^a-zA-Z0-9]+/g, ''));
        !context.containerApp && (context.newContainerAppName = resourceBaseName);
        context.imageName = `${resourceBaseName}:latest`;

        ext.outputChannel.appendLog(localize('usingResourceName', 'User provided resource name "{0}" as the default for resource creation.', resourceBaseName))
    }

    public async configureBeforePrompt(context: IDeployWorkspaceProjectContext): Promise<void> {
        const resourceBaseName: string = nonNullValueAndProp(context.rootFolder, 'name').replace(/[^a-zA-Z0-9]+/g, '');
        if (this.validateInput(resourceBaseName) !== undefined) {
            return;
        }

        // Verify that we can create all remaining resources with the given resource name
        if (!await areAllResourcesAvailable(context, resourceBaseName)) {
            return;
        }

        if (!(context.resourceGroup && context.managedEnvironment && context.registry && context.containerApp)) {
            ext.outputChannel.appendLog(localize('usingWorkspaceName', 'Using workspace name "{0}" as the default for remaining resource creation.', resourceBaseName))
        }

        !context.resourceGroup && (context.newResourceGroupName = resourceBaseName);
        !context.managedEnvironment && (context.newManagedEnvironmentName = resourceBaseName);
        !context.registry && (context.newRegistryName = resourceBaseName);
        !context.containerApp && (context.newContainerAppName = resourceBaseName);
        context.imageName = `${context.containerApp?.name || resourceBaseName}:latest`;
    }

    public shouldPrompt(context: IDeployWorkspaceProjectContext): boolean {
        return (!context.resourceGroup && !context.newResourceGroupName) ||
            (!context.managedEnvironment && !context.newManagedEnvironmentName) ||
            (!context.registry && !context.newRegistryName) ||
            (!context.containerApp && !context.newContainerAppName);
    }

    private validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';

        // No symbols are allowed for ACR - we will strip out the symbols from the base name, but need ensure this version has an appropriate length
        const nameWithoutSymbols: string = name.replace(/[^a-zA-Z0-9]+/g, '');
        if (!validateUtils.isValidLength(nameWithoutSymbols, 5, 20)) {
            return localize('invalidLength', 'The alphanumeric portion of the name should total to at least 5 characters while not exceeding 20 characters.');
        }

        if (!validateUtils.isLowerCaseAlphanumericWithSymbols(name)) {
            return validateUtils.getInvalidLowerCaseAlphanumericWithSymbolsMessage();
        }

        return undefined;
    }

    private async validateNameAvailability(context: IDeployWorkspaceProjectContext, name: string): Promise<string | undefined> {
        name = name.trim();

        return await window.withProgress({
            location: ProgressLocation.Notification,
            cancellable: false,
            title: localize('verifyingAvailabilityTitle', 'Verifying resource name availability...')
        }, async () => {
            const resourceGroupAvailable: boolean = await ResourceGroupListStep.isNameAvailable(context, name);
            const managedEnvironmentAvailable: boolean = await ManagedEnvironmentNameStep.isNameAvailable(context, name, name);
            const registryAvailable: boolean = await RegistryNameStep.isNameAvailable(context, name.replace(/[^a-zA-Z0-9]+/g, ''));
            const containerAppAvailable: boolean = await ContainerAppNameStep.isNameAvailable(context, name, name);

            return (resourceGroupAvailable && managedEnvironmentAvailable && registryAvailable && containerAppAvailable) ?
                undefined : localize('resourceNameUnavailable', 'Resource name "{0}" is already taken.', name);
        });
    }
}

async function areAllResourcesAvailable(context: IDeployWorkspaceProjectContext, resourceName: string): Promise<boolean> {
    const isAvailable: Record<string, boolean> = {};

    if (context.resourceGroup || await ResourceGroupListStep.isNameAvailable(context, resourceName)) {
        isAvailable['resourceGroup'] = true;
    }

    if (context.managedEnvironment || await ManagedEnvironmentNameStep.isNameAvailable(context, resourceName, resourceName)) {
        isAvailable['managedEnvironment'] = true;
    }

    if (context.registry || await RegistryNameStep.isNameAvailable(context, resourceName)) {
        isAvailable['containerRegistry'] = true;
    }

    if (context.containerApp || await ContainerAppNameStep.isNameAvailable(context, resourceName, resourceName)) {
        isAvailable['containerApp'] = true;
    }

    return isAvailable['resourceGroup'] && isAvailable['managedEnvironment'] && isAvailable['containerRegistry'] && isAvailable['containerApp'];
}
