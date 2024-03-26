/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type ContainerRegistryManagementClient, type Registry, type RegistryNameStatus } from "@azure/arm-containerregistry";
import { AzureWizardPromptStep, randomUtils, type ISubscriptionActionContext } from "@microsoft/vscode-azext-utils";
import { createContainerRegistryManagementClient } from "../../../../../../utils/azureClients";
import { localize } from "../../../../../../utils/localize";
import { type CreateAcrContext } from "./CreateAcrContext";

export class RegistryNameStep extends AzureWizardPromptStep<CreateAcrContext> {
    public async prompt(context: CreateAcrContext): Promise<void> {
        context.newRegistryName = await context.ui.showInputBox({
            prompt: localize('registryName', 'Enter a name for the new registry'),
            validateInput: RegistryNameStep.validateInput,
            asyncValidationTask: (value: string): Promise<string | undefined> => this.validateNameAvalability(context, value)
        });
    }

    public shouldPrompt(context: CreateAcrContext): boolean {
        return !context.newRegistryName;
    }

    public static validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';

        const { minLength, maxLength } = { minLength: 5, maxLength: 50 };
        if (name.length < minLength || name.length > maxLength) {
            return localize('validationLengthError', 'The name must be between {0} and {1} characters.', minLength, maxLength);
        } else if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
            return localize('validateInputError', `The name must consist of alphanumeric characters.`);
        }

        return undefined;
    }

    private async validateNameAvalability(context: CreateAcrContext, name: string) {
        const registryNameStatus = await RegistryNameStep.isNameAvailable(context, name);
        if (!registryNameStatus.nameAvailable) {
            return registryNameStatus.message ?? localize('validateInputError', `The registry name ${name} is unavailable.`);
        }
        return undefined;
    }

    public static async isNameAvailable(context: ISubscriptionActionContext, name: string): Promise<RegistryNameStatus> {
        try {
            const client: ContainerRegistryManagementClient = await createContainerRegistryManagementClient(context);
            return await client.registries.checkNameAvailability({ name: name, type: "Microsoft.ContainerRegistry/registries" });
        } catch (_theseHands) {
            return { nameAvailable: true };
        }
    }

    public static async tryGenerateRelatedName(context: ISubscriptionActionContext & { registry?: Registry }, name: string): Promise<string | undefined> {
        let registryAvailable: boolean = false;
        let generatedName: string = '';

        const timeoutSeconds: number = 15;
        const timeoutMs: number = timeoutSeconds * 1000;
        const start: number = Date.now();

        do {
            if (Date.now() > start + timeoutMs) {
                return undefined;
            }

            generatedName = generateRelatedName(name);
            registryAvailable = !!context.registry || !!(await RegistryNameStep.isNameAvailable(context, generatedName)).nameAvailable;
        } while (!registryAvailable)

        return generatedName;

        function generateRelatedName(name: string): string {
            const suffix = randomUtils.getRandomHexString(6);
            return (name.substring(0, 43) + suffix).replace(/[^a-zA-Z0-9]+/g, ''); // max length is 50 characters
        }
    }
}
