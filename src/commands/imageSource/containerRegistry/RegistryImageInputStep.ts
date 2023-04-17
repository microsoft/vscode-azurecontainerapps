/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { acrDomain, quickStartImageName } from "../../../constants";
import { parseImageName } from "../../../utils/imageNameUtils";
import { localize } from "../../../utils/localize";
import { IContainerRegistryImageContext } from "./IContainerRegistryImageContext";
import { getLatestContainerAppImage } from "./getLatestContainerImage";

export class RegistryImageInputStep extends AzureWizardPromptStep<IContainerRegistryImageContext> {
    public async prompt(context: IContainerRegistryImageContext): Promise<void> {
        const prompt: string = localize('registryImagePrompt', 'Enter the container image with tag');
        const placeHolder: string = localize('registryImagePlaceHolder', 'For example: `mcr.microsoft.com/azuredocs/containerapps-helloworld:latest`');

        // Try to suggest an image name only when the user is deploying to a Container App
        let value: string | undefined;
        if (context.targetContainer) {
            const { registryDomain, imageNameReference } = parseImageName(getLatestContainerAppImage(context.targetContainer));

            // Only bother carrying over the suggestion if the old image was from a third party registry
            if (registryDomain !== acrDomain && imageNameReference !== quickStartImageName) {
                value = imageNameReference;
            }
        }

        context.image = (await context.ui.showInputBox({
            prompt,
            placeHolder,
            value
        })).trim();

        context.valuesToMask.push(context.image);
    }

    public shouldPrompt(context: IContainerRegistryImageContext): boolean {
        return context.image === undefined;
    }
}
