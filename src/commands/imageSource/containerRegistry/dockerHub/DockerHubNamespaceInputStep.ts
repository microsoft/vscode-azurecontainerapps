/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { dockerHubDomain, quickStartImageName } from "../../../../constants";
import { parseImageName } from "../../../../utils/imageNameUtils";
import { localize } from "../../../../utils/localize";
import { IContainerRegistryImageContext } from "../IContainerRegistryImageContext";
import { getLatestContainerAppImage } from "../getLatestContainerImage";

export class DockerHubNamespaceInputStep extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const prompt: string = localize('dockerHubNamespacePrompt', 'Enter a Docker Hub namespace');
        context.dockerHubNamespace = (await context.ui.showInputBox({
            prompt,
            value: this.getSuggestedNamespace(context),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).toLowerCase();

        context.valuesToMask.push(context.dockerHubNamespace);
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return !context.dockerHubNamespace;
    }

    private async validateInput(name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';

        const { minLength, maxLength } = { minLength: 4, maxLength: 30 };
        if (/\W/.test(name)) {
            return localize('invalidNamespace', `A namespace name should only contain letters and/or numbers.`);
        } else if (name.length < minLength || name.length > maxLength) {
            return localize('invalidLength', 'The name must be between {0} and {1} characters.', minLength, maxLength);
        }

        return undefined;
    }

    private getSuggestedNamespace(context: IContainerRegistryImageContext): string {
        // Try to suggest a namespace only when the user is deploying to a Container App
        let suggestedNamespace: string | undefined;
        if (context.targetContainer) {
            const { registryDomain, namespace, imageNameReference } = parseImageName(getLatestContainerAppImage(context.targetContainer));

            // If the image is not the default quickstart image, then we can try to suggest a namespace based on the latest Container App image
            if (registryDomain === dockerHubDomain && imageNameReference !== quickStartImageName) {
                suggestedNamespace = namespace;
            }
        }

        return suggestedNamespace || 'library';
    }
}
