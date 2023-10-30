/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { URI, Utils } from "vscode-uri";
import { localize } from "../../../../utils/localize";
import { BuildImageInAzureImageSourceContext } from "./BuildImageInAzureContext";

export class ImageNameStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        const suggestedImageName = await getSuggestedName(context, context.rootFolder.uri.fsPath);

        context.imageName = await context.ui.showInputBox({
            prompt: localize('imageNamePrompt', 'Enter a name for the image'),
            value: suggestedImageName ? localize('dockerfilePlaceholder', suggestedImageName) : ''
        });
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.imageName;
    }

}

async function getSuggestedName(context: BuildImageInAzureImageSourceContext, dockerFilePath: string): Promise<string | undefined> {
    let suggestedImageName: string | undefined;
    suggestedImageName = Utils.dirname(URI.parse(dockerFilePath)).path.split('/').pop();
    if (suggestedImageName === '') {
        if (context.rootFolder) {
            suggestedImageName = Utils.basename(context.rootFolder.uri).toLowerCase().replace(/\s/g, '');
        }
    }
    suggestedImageName += ":{{.Run.ID}}";
    return suggestedImageName;
}
