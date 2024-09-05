/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type DockerBuildRequest as AcrDockerBuildRequest } from "@azure/arm-containerregistry";
import { AzExtFsExtra, AzureWizardExecuteStep, GenericParentTreeItem, activityFailContext, activityFailIcon, createUniversallyUniqueContextValue, type ExecuteActivityOutput } from "@microsoft/vscode-azext-utils";
import * as retry from 'p-retry';
import * as path from 'path';
import { type Progress } from "vscode";
import { ext } from "../../../../extensionVariables";
import { localize } from "../../../../utils/localize";
import { type BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";

export class RunStep extends AzureWizardExecuteStep<BuildImageInAzureImageSourceContext> {
    public priority: number = 540;

    public async execute(context: BuildImageInAzureImageSourceContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        // Need to keep the additional try wrapper here to execute finally, then we can catch any error that percolates up and display its output
        try {
            const runRequest: AcrDockerBuildRequest = {
                type: 'DockerBuildRequest',
                imageNames: [context.imageName],
                isPushEnabled: true,
                sourceLocation: context.uploadedSourceLocation,
                platform: { os: context.os },
                dockerFilePath: path.relative(context.srcPath, context.dockerfilePath)
            };

            const retries = 3;
            await retry(
                async (currentAttempt: number): Promise<void> => {
                    const message: string = currentAttempt === 1 ?
                        localize('buildingImage', 'Building image...') :
                        localize('buildingImageAttempt', 'Building image (Attempt {0}/{1})...', currentAttempt, retries + 1);
                    progress.report({ message: message });
                    ext.outputChannel.appendLog(message);

                    context.run = await context.client.registries.beginScheduleRunAndWait(context.resourceGroupName, context.registryName, runRequest);

                },
                { retries, minTimeout: 2 * 1000 }
            );
        } finally {
            if (await AzExtFsExtra.pathExists(context.tarFilePath)) {
                await AzExtFsExtra.deleteResource(context.tarFilePath);
            }
        }
    }

    public shouldExecute(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.run;
    }

    public createSuccessOutput(): ExecuteActivityOutput {
        // Skip here, success will be output by the build image step
        return {};
    }

    public createFailOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericParentTreeItem(undefined, {
                contextValue: createUniversallyUniqueContextValue(['runStepFailItem', activityFailContext]),
                label: localize('runLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activityFailIcon
            }),
            message: localize('runFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }
}
