/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { sendRequestWithTimeout } from "@microsoft/vscode-azext-azureutils";
import { AzureWizardExecuteStep, GenericTreeItem, nonNullProp, nonNullValue, openReadOnlyContent } from "@microsoft/vscode-azext-utils";
import { MessageItem, window } from "vscode";
import { acrDomain, activityFailContext, activityFailIcon, activitySuccessContext, activitySuccessIcon } from "../../../../constants";
import { ext } from "../../../../extensionVariables";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../../../utils/activityUtils";
import { localize } from "../../../../utils/localize";
import type { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";
import { buildImageInAzure } from "./buildImageInAzure";

export class BuildImageStep extends AzureWizardExecuteStep<IBuildImageInAzureContext> {
    public priority: number = 450;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: IBuildImageInAzureContext): Promise<void> {
        this.initSuccessOutput(context);
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
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
            },
            context, this.success, this.fail
        );

        ext.outputChannel.appendLog(localize('useImage', 'Using image "{0}".', context.image));
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.image;
    }

    private initSuccessOutput(context: IBuildImageInAzureContext): void {
        this.success.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['buildImageStep', activitySuccessContext]),
            label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
            iconPath: activitySuccessIcon
        });
        this.success.output = localize('buildImageSuccess', 'Finished building image "{0}" in registry "{1}".', context.imageName, context.registryName);
    }

    private initFailOutput(context: IBuildImageInAzureContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['buildImageStep', activityFailContext]),
            label: localize('buildImageLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('buildImageFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName);
    }
}
