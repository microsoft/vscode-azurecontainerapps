/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerRegistryManagementClient, RegistryNameStatus } from "@azure/arm-containerregistry";
import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../../../../utils/azureClients";
import { localize } from "../../../../../../utils/localize";
import { ICreateAcrContext } from "./ICreateAcrContext";

export class RegistryNameStep extends AzureWizardPromptStep<ICreateAcrContext> {
    public async prompt(context: ICreateAcrContext): Promise<void> {
        context.registryName = await context.ui.showInputBox({
            prompt: localize('registryName', 'Enter a name for the new registry'),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(context, value)
        })
    }

    public shouldPrompt(context: ICreateAcrContext): boolean {
        return !context.registryName;
    }

    private async validateInput(context: ICreateAcrContext, name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
            return localize('validateInputError', `Connection names can only consist of alphanumeric characters.`); //make it between 5 and 50 character
        } else {
            const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
            const nameResponse: RegistryNameStatus = await client.registries.checkNameAvailability({ name: name, type: "Microsoft.ContainerRegistry/registries" });
            if (nameResponse.nameAvailable === false) {
                return localize('validateInputError', `The registry name ${name} is already in use.`);
            }
        }
        return undefined;
    }
}
