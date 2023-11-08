/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { sendRequestWithTimeout } from "@microsoft/vscode-azext-azureutils";
import { GenericTreeItem, nonNullProp, nonNullValue, openReadOnlyContent } from "@microsoft/vscode-azext-utils";
import { MessageItem, window } from "vscode";
import { acrDomain, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../../../constants";
import { ExecuteActivityOutput, ExecuteActivityOutputStepBase } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";
import { buildImageInAzure } from "./buildImageInAzure";

export class BuildImageStep extends ExecuteActivityOutputStepBase<BuildImageInAzureImageSourceContext> {
    public priority: number = 450;

    protected async executeCore(context: BuildImageInAzureImageSourceContext): Promise<void> {
        context.registryDomain = acrDomain;

        const run = await buildImageInAzure(context);
        const outputImages = run?.outputImages;
        context.telemetry.properties.outputImagesCount = outputImages?.length?.toString();

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

    public shouldExecute(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.image;
    }

    protected createSuccessOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['buildImageStep', activitySuccessContext]),
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activitySuccessIcon
            }),
            message: [
                localize('buildImageSuccess', 'Finished building image "{0}" in registry "{1}".', context.imageName, context.registryName),
                localize('useImage', 'Using image "{0}".', context.image)
            ]
        };
    }

    protected createFailOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['buildImageStep', activityFailContext]),
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activityFailIcon
            }),
            message: localize('buildImageFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }
}
