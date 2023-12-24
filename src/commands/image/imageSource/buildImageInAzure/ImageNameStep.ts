/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullProp } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../../utils/localize";
import { validationUtils } from "../../../../utils/validationUtils";
import { type CreateContainerAppContext } from "../../../createContainerApp/CreateContainerAppContext";
import { type BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";

const maxImageNameLength: number = 46;

export class ImageNameStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        const suggestedImageName = ImageNameStep.getTimestampedImageName(
            context.containerApp?.name ||
            // Step is also technically reachable from the `createContainerApp` entry point
            nonNullProp((context as CreateContainerAppContext), 'newContainerAppName')
        );

        context.imageName = (await context.ui.showInputBox({
            prompt: localize('imageNamePrompt', 'Enter a name for the image'),
            value: suggestedImageName ?? '',
            validateInput: this.validateInput
        })).trim();
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.imageName;
    }

    private validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';

        if (!validationUtils.hasValidCharLength(name, 1, maxImageNameLength)) {
            return validationUtils.getInvalidCharLengthMessage(1, maxImageNameLength);
        }

        return undefined;
    }

    static getTimestampedImageName(repositoryName: string): string {
        const tag: string = getTimestampTag();
        return repositoryName.slice(0, maxImageNameLength - (tag.length + 1)) + ':' + tag;
    }
}

function getTimestampTag(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months start at 0, so add 1
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}
