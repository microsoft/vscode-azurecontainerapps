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
import type { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";
import { buildImageInAzure } from "./buildImageInAzure";

export class BuildImageStep extends ExecuteActivityOutputStepBase<IBuildImageInAzureContext> {
    public priority: number = 450;

    protected async executeCore(context: IBuildImageInAzureContext): Promise<void> {
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

        // Need to place this outside of 'initSuccessOutput' so we can use the image after it has had a chance to become defined
        (this.success.output as string[])?.push(localize('useImage', 'Using image "{0}".', context.image));
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.image;
    }

    protected initSuccessOutput(context: IBuildImageInAzureContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['buildImageStep', activitySuccessContext]),
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activitySuccessIcon
            }),
            output: [
                localize('buildImageSuccess', 'Finished building image "{0}" in registry "{1}".', context.imageName, context.registryName),
            ]
        };
    }

    protected initFailOutput(context: IBuildImageInAzureContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['buildImageStep', activityFailContext]),
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activityFailIcon
            }),
            output: localize('buildImageFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }
}
