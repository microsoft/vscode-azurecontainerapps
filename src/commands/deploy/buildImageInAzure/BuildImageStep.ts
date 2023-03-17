/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../../constants";
import { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";
import { buildImageInAzure } from "./buildImageInAzure";

export class BuildImageStep extends AzureWizardExecuteStep<IBuildImageInAzureContext> {
    public priority: number = 225;

    public async execute(context: IBuildImageInAzureContext): Promise<void> {
        context.registryDomain = acrDomain;

        const run = await buildImageInAzure(context);
        const outputImages = run?.outputImages;
        if (outputImages) {
            const image = outputImages[0];
            context.image = `${image.registry}/${image.repository}:${image.tag}`;
        }
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.image;
    }
}
