/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { sendRequestWithTimeout, type AzExtPipelineResponse } from "@microsoft/vscode-azext-azureutils";
import { GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp, nonNullValue, nonNullValueAndProp, type AzExtTreeItem } from "@microsoft/vscode-azext-utils";
import { ThemeColor, ThemeIcon, window, type MessageItem } from "vscode";
import { acrDomain } from "../../../../constants";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { openAcrBuildLogs, type AcrBuildResults } from "../../openAcrBuildLogs";
import { type BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";
import { buildImageInAzure } from "./buildImageInAzure";

export class BuildImageStep extends ExecuteActivityOutputStepBase<BuildImageInAzureImageSourceContext> {
    public priority: number = 450;
    protected acrBuildError: AcrBuildResults;

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
            const response: AzExtPipelineResponse = await sendRequestWithTimeout(context, { method: 'GET', url: nonNullValue(logSasUrl) }, 2500, undefined);
            const content: string = nonNullProp(response, 'bodyAsText');

            this.acrBuildError = {
                name: nonNullValueAndProp(context.run, 'name'),
                runId: nonNullValueAndProp(context.run, 'id'),
                content
            };

            const viewLogsButton: MessageItem = { title: localize('viewLogs', 'View Logs') };
            const errorMessage = localize('noImagesBuilt', 'Failed to build image. View logs for more details.');

            void window.showErrorMessage(errorMessage, viewLogsButton).then(async result => {
                if (result === viewLogsButton) {
                    await openAcrBuildLogs(context, this.acrBuildError);
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
        let loadMoreChildrenImpl: (() => Promise<AzExtTreeItem[]>) | undefined;
        if (this.acrBuildError) {
            loadMoreChildrenImpl = () => {
                const buildImageLogsItem = new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(['buildImageStep', 'logsLinkItem']),
                    label: localize('buildImageLogs', 'Click to view build image logs'),
                    iconPath: new ThemeIcon('note', new ThemeColor('terminal.ansiWhite')),
                    commandId: 'containerApps.openAcrBuildLogs',
                });
                buildImageLogsItem.commandArgs = [this.acrBuildError];
                return Promise.resolve([buildImageLogsItem]);
            };
        }

        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['buildImageStep', activityFailContext]),
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activityFailIcon,
                loadMoreChildrenImpl: loadMoreChildrenImpl ?? (() => Promise.resolve([]))
            }),
            message: localize('buildImageFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }
}
