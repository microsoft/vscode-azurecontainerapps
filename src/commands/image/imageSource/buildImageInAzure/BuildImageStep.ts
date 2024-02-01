/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type DockerBuildRequest as AcrDockerBuildRequest, type Run as AcrRun } from "@azure/arm-containerregistry";
import { sendRequestWithTimeout, type AzExtPipelineResponse } from "@microsoft/vscode-azext-azureutils";
import { AzExtFsExtra, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp, nonNullValue, nonNullValueAndProp, type AzExtTreeItem } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { ThemeColor, ThemeIcon, window, type MessageItem, type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { delay } from "../../../../utils/delay";
import { localize } from "../../../../utils/localize";
import { openAcrBuildLogs, type AcrBuildResults } from "../../openAcrBuildLogs";
import { type BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";
import { buildImageInAzure } from "./buildImageInAzure";

export class BuildImageStep extends ExecuteActivityOutputStepBase<BuildImageInAzureImageSourceContext> {
    public priority: number = 450;
    protected acrBuildError: AcrBuildResults;

    protected async executeCore(context: BuildImageInAzureImageSourceContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const runRequest: AcrDockerBuildRequest = {
            type: 'DockerBuildRequest',
            imageNames: [context.imageName],
            isPushEnabled: true,
            sourceLocation: context.uploadedSourceLocation,
            platform: { os: context.os },
            dockerFilePath: path.relative(context.srcPath, context.dockerfilePath)
        };
        progress.report({ message: localize('buildingImage', 'Building image...') });

        const retryLimit: number = 5;
        const delayTimeMs: number = 1000;
        let r: number = 1;
        while (true) {
            // Schedule the ACR run
            try {
                if (r > 1) {
                    // add output log message and progress report update...
                } else if (r === retryLimit) {
                    throw new Error('retry limit exceeded');
                }

                await delay(delayTimeMs);
                await context.client.registries.beginScheduleRunAndWait(context.resourceGroupName, context.registryName, runRequest);
                r += 1;
            } catch (e) {
                // Delete the tar file and exit the process
                if (await AzExtFsExtra.pathExists(context.tarFilePath)) {
                    await AzExtFsExtra.deleteResource(context.tarFilePath);
                }
                throw e;
            }

            // Poll ACR for the final run output
            const run: AcrRun | undefined = await buildImageInAzure(context);
            const outputImages = run?.outputImages;
            context.telemetry.properties.outputImagesCount = outputImages?.length?.toString();

            if (outputImages) {
                const image = outputImages[0];
                context.image = `${image.registry}/${image.repository}:${image.tag}`;
                break;
            } else {
                const logSasUrl = (await context.client.runs.getLogSasUrl(context.resourceGroupName, context.registryName, nonNullValueAndProp(run, 'runId'))).logLink;
                const response: AzExtPipelineResponse = await sendRequestWithTimeout(context, { method: 'GET', url: nonNullValue(logSasUrl) }, 2500, undefined);
                const content: string = nonNullProp(response, 'bodyAsText');

                // Inspect content to see if the error is due to url issue
                if (content === 'placeholder') {
                    continue;
                }

                this.acrBuildError = {
                    name: nonNullValueAndProp(run, 'name'),
                    runId: nonNullValueAndProp(run, 'id'),
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
    }

    public shouldExecute(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.image;
    }

    protected createSuccessOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['buildImageStepSuccessItem', activitySuccessContext]),
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activitySuccessIcon
            }),
            message: localize('buildImageSuccess', 'Finished building image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }

    protected createFailOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        let loadMoreChildrenImpl: (() => Promise<AzExtTreeItem[]>) | undefined;
        if (this.acrBuildError) {
            loadMoreChildrenImpl = () => {
                const buildImageLogsItem = new GenericTreeItem(undefined, {
                    contextValue: createActivityChildContext(['logsLinkItem']),
                    label: localize('buildImageLogs', 'Click to view build image logs'),
                    iconPath: new ThemeIcon('link-external', new ThemeColor('terminal.ansiWhite')),
                    commandId: 'containerApps.openAcrBuildLogs',
                });
                buildImageLogsItem.commandArgs = [this.acrBuildError];
                return Promise.resolve([buildImageLogsItem]);
            };
        }

        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createActivityChildContext(['buildImageStepFailItem', activityFailContext]),
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activityFailIcon,
                loadMoreChildrenImpl
            }),
            message: localize('buildImageFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }
}
