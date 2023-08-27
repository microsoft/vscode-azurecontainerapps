/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardPromptStep, randomUtils } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { ContainerAppNameStep } from "../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../createManagedEnvironment/ManagedEnvironmentNameStep";
import { RegistryNameStep } from "../deployImage/imageSource/containerRegistry/acr/createAcr/RegistryNameStep";
import { IDeployWorkspaceProjectContext } from "./IDeployWorkspaceProjectContext";

export class DefaultResourcesNameStep extends AzureWizardPromptStep<IDeployWorkspaceProjectContext> {
    private registryName: string | undefined;

    public async prompt(context: IDeployWorkspaceProjectContext): Promise<void> {
        const resourceBaseName: string = (await context.ui.showInputBox({
            prompt: localize('resourceBaseNamePrompt', 'Enter a name for the container app resources.'),
            // Use the resource with the most strict name input validation
            validateInput: ManagedEnvironmentNameStep.validateInput,
            asyncValidationTask: (name: string) => this.validateNameAvailable(context, name)
        })).trim();

        // Set default names
        !context.resourceGroup && (context.newResourceGroupName = resourceBaseName);
        !context.managedEnvironment && (context.newManagedEnvironmentName = resourceBaseName);
        !context.registry && (context.newRegistryName = this.registryName);
        !context.containerApp && (context.newContainerAppName = resourceBaseName);
        context.imageName = `${this.registryName}:latest`;
    }

    public shouldPrompt(context: IDeployWorkspaceProjectContext): boolean {
        return !context.resourceGroup || !context.managedEnvironment || !context.registry || !context.containerApp;
    }

    private async validateNameAvailable(context: IDeployWorkspaceProjectContext, name: string): Promise<string | undefined> {
        name = name.trim();

        const registryName: string = name.replace(/[^a-zA-Z0-9]+/g, '');
        this.registryName = registryName + randomUtils.getRandomHexString(Math.abs(registryName.length - 5));

        const resourceGroupAvailable: boolean = await ResourceGroupListStep.isNameAvailable(context, name);
        const managedEnvironmentAvailable: boolean = await ManagedEnvironmentNameStep.isNameAvailable(context, name, name);
        const registryAvailable: boolean = await RegistryNameStep.isNameAvailable(context, this.registryName);
        const containerAppAvailable: boolean = await ContainerAppNameStep.isNameAvailable(context, name, name);

        return (resourceGroupAvailable && managedEnvironmentAvailable && registryAvailable && containerAppAvailable) ?
            undefined : localize('resourceNameUnavailable', 'Resource name "{0}" is already taken.', name);
    }
}
