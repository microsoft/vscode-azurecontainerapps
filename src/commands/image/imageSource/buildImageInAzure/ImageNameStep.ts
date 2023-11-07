/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { URI, Utils } from "vscode-uri";
import { localize } from "../../../../utils/localize";
import { validateUtils } from "../../../../utils/validateUtils";
import { CreateContainerAppContext } from "../../../createContainerApp/CreateContainerAppContext";
import type { BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";

const maxImageNameLength: number = 46;

export class ImageNameStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        const suggestedImageName = ImageNameStep.generateSuggestedImageName(
            context.containerApp?.name ||
            // Step is also technically reachable from the `createContainerApp` entry point
            (context as CreateContainerAppContext).newContainerAppName ||
            await getSuggestedRepositoryName(context, context.rootFolder.name)
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

        if (!validateUtils.isValidLength(name, 1, maxImageNameLength)) {
            return validateUtils.getInvalidLengthMessage(1, maxImageNameLength);
        }

        return undefined;
    }

    static generateSuggestedImageName(repositoryName: string = 'hello-world'): string {
        const tag: string = getTimestampTag();
        return repositoryName.slice(0, maxImageNameLength - (tag.length + 1)) + ':' + tag;
    }
}

async function getSuggestedRepositoryName(context: BuildImageInAzureImageSourceContext, dockerFilePath: string): Promise<string | undefined> {
    let suggestedRepositoryName: string | undefined;
    suggestedRepositoryName = Utils.dirname(URI.parse(dockerFilePath)).path.split('/').pop();

    if (suggestedRepositoryName === '') {
        if (context.rootFolder) {
            suggestedRepositoryName = Utils.basename(context.rootFolder.uri).toLowerCase().replace(/\s/g, '');
        }
    }

    return suggestedRepositoryName;
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
