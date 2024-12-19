/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { dockerHubDomain } from "../../../../../constants";
import { parseImageName } from "../../../../../utils/imageNameUtils";
import { localize } from "../../../../../utils/localize";
import { type ContainerRegistryImageSourceContext } from "../ContainerRegistryImageSourceContext";
import { getLatestContainerAppImage } from "../getLatestContainerImage";

export class DockerHubNamespaceInputStep extends AzureWizardPromptStep<ContainerRegistryImageSourceContext> {
    public async prompt(context: ContainerRegistryImageSourceContext): Promise<void> {
        const prompt: string = localize('dockerHubNamespacePrompt', 'Enter a Docker Hub namespace');
        context.dockerHubNamespace = (await context.ui.showInputBox({
            prompt,
            value: this.getSuggestedNamespace(context),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).toLowerCase();

        context.valuesToMask.push(context.dockerHubNamespace);
    }

    public shouldPrompt(context: ContainerRegistryImageSourceContext): boolean {
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

    private getSuggestedNamespace(context: ContainerRegistryImageSourceContext): string {
        let suggestedNamespace: string | undefined;
        if (context.containerApp) {
            const { registryDomain, namespace } = parseImageName(getLatestContainerAppImage(context.containerApp, context.containersIdx ?? 0));
            if (context.containerApp.revisionsMode === KnownActiveRevisionsMode.Single && registryDomain === dockerHubDomain) {
                suggestedNamespace = namespace;
            }
        }

        return suggestedNamespace || 'library';
    }
}
