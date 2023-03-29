/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { IContainerRegistryImageContext } from "./IContainerRegistryImageContext";

export class RegistryImageInputStep extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const prompt: string = localize('registryImagePrompt', 'Enter the container image with tag');
        const placeHolder: string = localize('registryImagePlaceHolder', 'For example: `mcr.microsoft.com/azuredocs/containerapps-helloworld:latest`')
        context.image = (await context.ui.showInputBox({
            prompt,
            placeHolder,
        })).trim();

        context.valuesToMask.push(context.image);
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return context.image === undefined;
    }
}
