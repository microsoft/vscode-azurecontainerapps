/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type DockerBuildRequest as AcrDockerBuildRequest } from "@azure/arm-containerregistry";
import { AzExtFsExtra, GenericTreeItem } from "@microsoft/vscode-azext-utils";
import * as path from 'path';
import { type Progress } from "vscode";
import { activityFailContext, activityFailIcon } from "../../../../constants";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { createActivityChildContext } from "../../../../utils/activity/activityUtils";
import { localize } from "../../../../utils/localize";
import { type BuildImageInAzureImageSourceContext } from "./BuildImageInAzureImageSourceContext";

export class RunStep extends ExecuteActivityOutputStepBase<BuildImageInAzureImageSourceContext> {
    public priority: number = 440;

    protected async executeCore(context: BuildImageInAzureImageSourceContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        // Need to keep the additional try wrapper here to execute finally, then we can catch any error that percolates up and display its output
        try {
            const runRequest: AcrDockerBuildRequest = {
                type: 'DockerBuildRequest',
                imageNames: [context.imageName],
                isPushEnabled: true,
                sourceLocation: context.uploadedSourceLocation,
                platform: { os: context.os },
                dockerFilePath: path.basename(context.dockerfilePath) /* Assume the dockerfile is always in the root of the source */
            };

            const building: string = localize('buildingImage', 'Building image...');
            progress.report({ message: building });

            context.run = await context.client.registries.beginScheduleRunAndWait(context.resourceGroupName, context.registryName, runRequest);
        } finally {
            if (await AzExtFsExtra.pathExists(context.tarFilePath)) {
                await AzExtFsExtra.deleteResource(context.tarFilePath);
            }
        }
    }

    public shouldExecute(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.run;
    }

    protected createSuccessOutput(): ExecuteActivityOutput {
        // Skip here, success will be output by the build image step
        return {};
    }

    protected createFailOutput(context: BuildImageInAzureImageSourceContext): ExecuteActivityOutput {
        return {
            item: new GenericTreeItem(undefined, {
                contextValue: createActivityChildContext(['runStep', activityFailContext]),
                label: localize('runLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
                iconPath: activityFailIcon
            }),
            message: localize('runFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName)
        };
    }
}
