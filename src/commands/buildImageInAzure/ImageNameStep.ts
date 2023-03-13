/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { Item } from "./DockerFileItemStep";
import { IBuildImageContext } from "./IBuildImageContext";
import path = require("path");

export class ImageNameStep extends AzureWizardPromptStep<IBuildImageContext> {
    public async prompt(context: IBuildImageContext): Promise<void> {
        const suggestedImageName = await getSuggestedName(context, context.dockerFile);

        context.imageName = await context.ui.showInputBox({
            prompt: localize('imageNamePrompt', 'Enter a name for the image'),
            value: suggestedImageName ? localize('dockerfilePlaceholder', suggestedImageName) : ''
        });
    }

    public shouldPrompt(context: IBuildImageContext): boolean {
        return !context.imageName;
    }

}

async function getSuggestedName(context: IBuildImageContext, dockerFileItem: Item): Promise<string | undefined> {
    let suggestedImageName: string | undefined = path.basename(dockerFileItem.relativeFolderPath).toLowerCase();

    if (suggestedImageName === '.') {
        if (context.rootFolder) {
            suggestedImageName = path.basename(context.rootFolder.uri.fsPath).toLowerCase().replace(/\s/g, '');
        }
    }
    suggestedImageName += ":{{.Run.ID}}";

    return suggestedImageName;
}
