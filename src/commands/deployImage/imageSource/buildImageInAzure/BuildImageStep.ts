/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { sendRequestWithTimeout } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, nonNullProp, nonNullValue, openReadOnlyContent } from "@microsoft/vscode-azext-utils";
import { MessageItem, window } from "vscode";
import { acrDomain } from "../../../../constants";
import { localize } from "../../../../utils/localize";
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
            const contentTask = sendRequestWithTimeout(context, { method: 'GET', url: nonNullValue(logSasUrl) }, 2500, undefined)

            const viewLogsButton: MessageItem = { title: localize('viewLogs', 'View Logs') };
            const errorMessage = localize('noImagesBuilt', 'Failed to build image. View logs for more details.');
            void window.showErrorMessage(errorMessage, viewLogsButton).then(async result => {
                if (result === viewLogsButton) {
                    const content = nonNullProp((await contentTask), 'bodyAsText')
                    await openReadOnlyContent({ label: nonNullValue(context.run.name), fullId: nonNullValue(context.run.id) }, content, '.log');
                }
            });

            context.errorHandling.suppressDisplay = true;
            throw new Error(errorMessage);
        }
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.image;
    }
}

