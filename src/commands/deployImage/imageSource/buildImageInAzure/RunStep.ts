/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { DockerBuildRequest as AcrDockerBuildRequest } from "@azure/arm-containerregistry";
import { AzExtFsExtra, AzureWizardExecuteStep, GenericTreeItem } from "@microsoft/vscode-azext-utils";
import * as path from 'path';
import { type Progress } from "vscode";
import { activityFailContext, activityFailIcon } from "../../../../constants";
import { ExecuteActivityOutput, createActivityChildContext, tryCatchActivityWrapper } from "../../../../utils/activityUtils";
import { localize } from "../../../../utils/localize";
import type { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";

export class RunStep extends AzureWizardExecuteStep<IBuildImageInAzureContext> {
    public priority: number = 440;
    private success: ExecuteActivityOutput = {};
    private fail: ExecuteActivityOutput = {};

    public async execute(context: IBuildImageInAzureContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        // Skip 'initSuccessOutput', success will be output by the build image step, only show a fail here if we catch an error
        this.initFailOutput(context);

        await tryCatchActivityWrapper(
            async () => {
                // Need to keep the additional try wrapper here to execute finally, then we can catch any error that percolates up and display its output
                try {
                    const rootUri = context.rootFolder.uri;

                    const runRequest: AcrDockerBuildRequest = {
                        type: 'DockerBuildRequest',
                        imageNames: [context.imageName],
                        isPushEnabled: true,
                        sourceLocation: context.uploadedSourceLocation,
                        platform: { os: context.os },
                        dockerFilePath: path.relative(rootUri.path, context.dockerfilePath)
                    };

                    const building: string = localize('buildingImage', 'Building image...');
                    progress.report({ message: building });

                    context.run = await context.client.registries.beginScheduleRunAndWait(context.resourceGroupName, context.registryName, runRequest);
                } finally {
                    if (await AzExtFsExtra.pathExists(context.tarFilePath)) {
                        await AzExtFsExtra.deleteResource(context.tarFilePath);
                    }
                }
            },
            context, this.success, this.fail
        );
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.run;
    }

    private initFailOutput(context: IBuildImageInAzureContext): void {
        this.fail.item = new GenericTreeItem(undefined, {
            contextValue: createActivityChildContext(['runStep', activityFailContext]),
            label: localize('runLabel', 'Build image "{0}" in registry "{1}"', context.imageName, context.registryName),
            iconPath: activityFailIcon
        });
        this.fail.output = localize('runFail', 'Failed to build image "{0}" in registry "{1}".', context.imageName, context.registryName);
    }
}
