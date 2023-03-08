/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { IDeployFromRegistryContext } from "./IDeployFromRegistryContext";

export class RegistryImageInputStep extends AzureWizardPromptStep<IDeployFromRegistryContext> {
    public async prompt(context: IDeployFromRegistryContext): Promise<void> {
        const prompt: string = localize('registryImagePrompt', 'Enter the container image with tag');
        const placeHolder: string = localize('registryImagePlaceHolder', 'For example: `mcr.microsoft.com/azuredocs/containerapps-helloworld:latest`')
        context.image = (await context.ui.showInputBox({
            prompt,
            placeHolder,
        })).trim();

        context.valuesToMask.push(context.image);
    }

    public shouldPrompt(context: IDeployFromRegistryContext): boolean {
        return context.image === undefined;
    }
}
