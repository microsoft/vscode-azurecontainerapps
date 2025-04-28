/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { sendRequestWithTimeout, type AzExtPipelineResponse } from "@microsoft/vscode-azext-azureutils";
import { ActivityChildItem, ActivityChildType, AzureWizardExecuteStep, activityFailContext, activityFailIcon, activityProgressContext, activityProgressIcon, activitySuccessContext, activitySuccessIcon, createContextValue, nonNullProp, nonNullValue, nonNullValueAndProp, type ActivityChildItemOptions, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import { ThemeColor, ThemeIcon, TreeItemCollapsibleState, window, type MessageItem } from "vscode";
import { acrDomain } from "../../../../constants";
import { localize } from "../../../../utils/localize";
import { openAcrBuildLogs, type AcrBuildResults } from "../../openAcrBuildLogs";
import { type BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";
import { buildImageInAzure } from "./buildImageInAzure";

const buildImageStepContext: string = 'buildImageStepItem';

export class BuildImageStep<T extends BuildImageInAzureImageSourceContext> extends AzureWizardExecuteStep<T> {
    public priority: number = 550;
    protected acrBuildError: AcrBuildResults;

    public async execute(context: T): Promise<void> {
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

    public shouldExecute(context: T): boolean {
        return !context.image;
    }

    public createSuccessOutput(context: T): ExecuteActivityOutput {
        return {
            item: new ActivityChildItem({
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                contextValue: createContextValue([buildImageStepContext, activitySuccessContext]),
                activityType: ActivityChildType.Success,
                iconPath: activitySuccessIcon
            }),
            message: localize('buildImageSuccess', 'Finished building image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }

    public createProgressOutput(context: T): ExecuteActivityOutput {
        return {
            item: new ActivityChildItem({
                label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                contextValue: createContextValue([buildImageStepContext, activityProgressContext]),
                activityType: ActivityChildType.Progress,
                iconPath: activityProgressIcon
            })
        };
    }

    public createFailOutput(context: T): ExecuteActivityOutput {
        const baseTreeItemOptions: ActivityChildItemOptions = {
            label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
            contextValue: createContextValue([buildImageStepContext, activityFailContext]),
            initialCollapsibleState: TreeItemCollapsibleState.Expanded,
            activityType: ActivityChildType.Fail,
            iconPath: activityFailIcon,
            isParent: true,
        };

        let item: ActivityChildItem | undefined;
        if (this.acrBuildError) {
            item = new ActivityChildItem({ ...baseTreeItemOptions });
            item.getChildren = () => {
                const buildImageLogsItem = new ActivityChildItem({
                    label: localize('buildImageLogs', 'Click to view build image logs'),
                    contextValue: 'logsLinkItem',
                    activityType: ActivityChildType.Command,
                    iconPath: new ThemeIcon('link-external', new ThemeColor('terminal.ansiWhite')),
                    command: {
                        title: '',
                        command: 'containerApps.openAcrBuildLogs',
                        arguments: [this.acrBuildError],
                    }
                });
                return Promise.resolve([buildImageLogsItem]);
            };
        }

        return {
            item: item ?? new ActivityChildItem({ ...baseTreeItemOptions }),
            message: localize('buildImageFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }
}
