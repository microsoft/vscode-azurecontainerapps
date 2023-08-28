/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { validateUtils } from "../../utils/validateUtils";
import { ContainerAppNameStep } from "../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../createManagedEnvironment/ManagedEnvironmentNameStep";
import { RegistryNameStep } from "../deployImage/imageSource/containerRegistry/acr/createAcr/RegistryNameStep";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";

export class DefaultResourcesNameStep extends AzureWizardPromptStep<IDeployWorkspaceProjectContext> {
    public async prompt(context: IDeployWorkspaceProjectContext): Promise<void> {
        const resourceBaseName: string = (await context.ui.showInputBox({
            prompt: localize('resourceBaseNamePrompt', 'Enter a name for the container app resources.'),
            validateInput: this.validateInput,
            asyncValidationTask: (name: string) => this.validateNameAvailable(context, name)
        })).trim();

        const registryName: string = resourceBaseName.replace(/[^a-zA-Z0-9]+/g, '');

        // Set default names
        !context.resourceGroup && (context.newResourceGroupName = resourceBaseName);
        !context.managedEnvironment && (context.newManagedEnvironmentName = resourceBaseName);
        !context.registry && (context.newRegistryName = registryName);
        !context.containerApp && (context.newContainerAppName = resourceBaseName);
        context.imageName = `${registryName}:latest`;
    }

    public shouldPrompt(context: IDeployWorkspaceProjectContext): boolean {
        return !context.resourceGroup || !context.managedEnvironment || !context.registry || !context.containerApp;
    }

    private validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';

        // No symbols are allowed for ACR - we will strip out the symbols from the base name, but need to make this version has an appropriate length
        const nameWithoutSymbols: string = name.replace(/[^a-zA-Z0-9]+/g, '');
        if (!validateUtils.isValidLength(nameWithoutSymbols, 5, 20)) {
            return localize('invalidLength', 'The alphanumeric portions of the name should total to at least 5 characters while not exceeding 20 characters.');
        }

        if (!validateUtils.isLowerCaseAlphanumericWithSymbols(name)) {
            return validateUtils.getInvalidLowerCaseAlphanumericWithSymbolsMessage();
        }

        return undefined;
    }

    private async validateNameAvailable(context: IDeployWorkspaceProjectContext, name: string): Promise<string | undefined> {
        name = name.trim();

        const resourceGroupAvailable: boolean = await ResourceGroupListStep.isNameAvailable(context, name);
        const managedEnvironmentAvailable: boolean = await ManagedEnvironmentNameStep.isNameAvailable(context, name, name);
        const registryAvailable: boolean = await RegistryNameStep.isNameAvailable(context, name.replace(/[^a-zA-Z0-9]+/g, ''));
        const containerAppAvailable: boolean = await ContainerAppNameStep.isNameAvailable(context, name, name);

        return (resourceGroupAvailable && managedEnvironmentAvailable && registryAvailable && containerAppAvailable) ?
            undefined : localize('resourceNameUnavailable', 'Resource name "{0}" is already taken.', name);
    }
}
