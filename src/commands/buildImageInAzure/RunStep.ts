/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { DockerBuildRequest as AcrDockerBuildRequest } from "@azure/arm-containerregistry";
import { AzureWizardExecuteStep } from "@microsoft/vscode-azext-utils";
import * as fse from 'fs-extra';
import { IBuildImageContext } from "./IBuildImageContext";
import path = require("path");

export class RunStep extends AzureWizardExecuteStep<IBuildImageContext> {
    public priority: number = 250;

    public async execute(context: IBuildImageContext): Promise<void> {
        try {
            const rootUri = context.rootFolder.uri;

            const runRequest: AcrDockerBuildRequest = {
                type: 'DockerBuildRequest',
                imageNames: [context.imageName],
                isPushEnabled: true,
                sourceLocation: context.uploadedSourceLocation,
                platform: { os: context.os },
                dockerFilePath: path.relative(rootUri.fsPath, context.dockerFile.absoluteFilePath)
            };

            context.run = await context.client.registries.beginScheduleRunAndWait(context.resourceGroupName, context.registryName, runRequest);
        } finally {
            if (await fse.pathExists(context.tarFilePath)) {
                await fse.unlink(context.tarFilePath);
            }
        }
    }

    public shouldExecute(context: IBuildImageContext): boolean {
        return !context.run
    }
}

