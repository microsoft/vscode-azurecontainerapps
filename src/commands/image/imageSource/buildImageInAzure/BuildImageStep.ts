/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type DockerBuildRequest as AcrDockerBuildRequest, type Run as AcrRun } from "@azure/arm-containerregistry";
import { sendRequestWithTimeout, type AzExtPipelineResponse } from "@microsoft/vscode-azext-azureutils";
import { AzExtFsExtra, GenericParentTreeItem, GenericTreeItem, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon, nonNullProp, nonNullValue, nonNullValueAndProp, type AzExtTreeItem } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { ThemeColor, ThemeIcon, window, type MessageItem, type Progress } from "vscode";
import { ext } from "../../../../extensionVariables";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { delay } from "../../../../utils/delay";
import { localize } from "../../../../utils/localize";
import { openAcrBuildLogs, type AcrBuildResults } from "../../openAcrBuildLogs";
import { type BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";
import { buildImageInAzure } from "./buildImageInAzure";

const RETRY_LIMIT = 5;
const DELAY_BETWEEN_RUN_REQUESTS_MS = 1000;

export class BuildImageStep extends ExecuteActivityOutputStepBase<BuildImageInAzureImageSourceContext> {
    public priority: number = 450;
    private acrRunCount: number = 0;
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
        ext.outputChannel.appendLog(localize('buildingImageLog', 'Building image...'));

        let acrRunId: string | undefined;
        while (true) {
            if (this.acrRunCount > 0) {
                await delay(DELAY_BETWEEN_RUN_REQUESTS_MS);

                progress.report(({ message: localize('buildingImageRetry', 'Building image (Attempt {0}/{1})...', this.acrRunCount + 1, RETRY_LIMIT) }));
                ext.outputChannel.appendLog(localize('buildingImageRetryLog', 'Building image (Attempt {0}/{1})...', this.acrRunCount + 1, RETRY_LIMIT));
            }

            // Schedule the ACR build image run
            try {
                acrRunId = (await context.client.registries.beginScheduleRunAndWait(context.resourceGroupName, context.registryName, runRequest)).runId;
                this.acrRunCount++;
            } catch (e) {
                // No known benefits to enforcing retries at this stage-- only check for retries if we can interpret specific actions from the build logs
                await this.removeTarFile(context);
                throw e;
            }

            // Poll ACR for the final run output
            const finishedRun: AcrRun | undefined = await buildImageInAzure(context, nonNullValue(acrRunId));

            const image = finishedRun?.outputImages?.[0];
            if (image) {
                context.image = `${image.registry}/${image.repository}:${image.tag}`;
                return;
            } else {
                await this.handleFailedAcrRunAndThrowIfNecessary(context, nonNullValue(finishedRun));
            }
        }
    }

    public shouldExecute(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.image;
    }

    /**
     * @throws Should handle/convert the failed ACR run into a thrown error unless a valid retry condition is met
     */
    private async handleFailedAcrRunAndThrowIfNecessary(context: BuildImageInAzureImageSourceContext, run: AcrRun): Promise<void> {
        const logSasUrl = (await context.client.runs.getLogSasUrl(context.resourceGroupName, context.registryName, nonNullValueAndProp(run, 'runId'))).logLink;
        const response: AzExtPipelineResponse = await sendRequestWithTimeout(context, { method: 'GET', url: nonNullValue(logSasUrl) }, 2500, undefined);
        const content: string = nonNullProp(response, 'bodyAsText');

        if (this.acrRunCount < RETRY_LIMIT) {
            const failedToDownload: RegExp = /(.*)failed(.*)download(.*)/i; // Retry if the download wasn't ready
            // Todo: Remove later, test case...
            // const failedToDownload: RegExp = /(.*)finish(.*)download(.*)/i;
            if (failedToDownload.test(content)) {
                return;
            }
        }

        await this.removeTarFile(context);

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

    private async removeTarFile(context: BuildImageInAzureImageSourceContext): Promise<void> {
        if (await AzExtFsExtra.pathExists(context.tarFilePath)) {
            await AzExtFsExtra.deleteResource(context.tarFilePath);
        }
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
