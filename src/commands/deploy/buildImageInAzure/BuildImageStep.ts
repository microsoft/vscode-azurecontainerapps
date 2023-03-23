/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardExecuteStep, nonNullValue } from "@microsoft/vscode-azext-utils";
import { acrDomain } from "../../../constants";
import { localize } from "../../../utils/localize";
import { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";
import { buildImageInAzure } from "./buildImageInAzure";

export class BuildImageStep extends AzureWizardExecuteStep<IBuildImageInAzureContext> {
    public priority: number = 225;

    public async execute(context: IBuildImageInAzureContext): Promise<void> {
        context.registryDomain = acrDomain;

        const run = await buildImageInAzure(context);
        const outputImages = run?.outputImages;
        context.telemetry.properties.outputImages = outputImages?.length?.toString();

        if (outputImages) {
            const image = outputImages[0];
            context.image = `${image.registry}/${image.repository}:${image.tag}`;
        } else {
            const logSasUrl = (await context.client.runs.getLogSasUrl(context.resourceGroupName, context.registryName, nonNullValue(context.run.runId))).logLink;
            const errorMessage = localize('noImagesBuilt', 'Failed to build image. View [logs]({0}) for more details.', logSasUrl);
            throw new Error(errorMessage);
        }
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.image;
    }
}
