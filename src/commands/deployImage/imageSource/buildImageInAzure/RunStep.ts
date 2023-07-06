/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { DockerBuildRequest as AcrDockerBuildRequest } from "@azure/arm-containerregistry";
import { AzExtFsExtra, AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import * as path from 'path';
import type { Progress } from "vscode";
import { localize } from "../../../../utils/localize";
import type { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";

export class RunStep extends AzureWizardExecuteStep<IBuildImageInAzureContext> {
    public priority: number = 200;

    public async execute(context: IBuildImageInAzureContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        try {
            const rootUri = context.rootFolder.uri;

            const runRequest: AcrDockerBuildRequest = {
                type: 'DockerBuildRequest',
                imageNames: [context.imageName],
                isPushEnabled: true,
                sourceLocation: context.uploadedSourceLocation,
                platform: { os: context.os },
                dockerFilePath: path.relative(rootUri.path, context.dockerFilePath)
            };

            const building: string = localize('buildingImage', 'Building image "{0}" in registry "{1}"...', context.imageName, context.registryName);
            progress.report({ message: building });

            context.run = await context.client.registries.beginScheduleRunAndWait(context.resourceGroupName, context.registryName, runRequest);
        } finally {
            if (await AzExtFsExtra.pathExists(context.tarFilePath)) {
                await AzExtFsExtra.deleteResource(context.tarFilePath);
            }
        }
    }

    public shouldExecute(context: IBuildImageInAzureContext): boolean {
        return !context.run
    }
}
