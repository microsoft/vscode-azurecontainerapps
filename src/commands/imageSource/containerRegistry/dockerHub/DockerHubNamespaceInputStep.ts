/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../../utils/localize";
import { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";

let checkNameLength: boolean = false;
export class DockerHubNamespaceInputStep extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const prompt: string = localize('dockerHubNamespacePrompt', 'Enter a Docker Hub namespace');
        context.dockerHubNamespace = (await context.ui.showInputBox({
            prompt,
            value: 'library',
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).toLowerCase();

        context.valuesToMask.push(context.dockerHubNamespace);
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return !context.dockerHubNamespace;
    }

    private async validateInput(name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';
        // to prevent showing an error when the character types the first letter
        checkNameLength = checkNameLength || name.length > 1;

        const { minLength, maxLength } = { minLength: 4, maxLength: 30 };
        if (/\W/.test(name)) {
            return localize('invalidNamespace', `A namespace name should only contain letters and/or numbers.`);
        } else if ((checkNameLength && name.length < minLength) || name.length > maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', minLength, maxLength);
        }

        return undefined;
    }
}
