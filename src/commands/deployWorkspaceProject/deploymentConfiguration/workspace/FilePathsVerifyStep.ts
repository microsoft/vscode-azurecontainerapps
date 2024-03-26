/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { type Progress } from "vscode";
import { ExecuteActivityOutputStepBase, type ExecuteActivityOutput } from "../../../../utils/activity/ExecuteActivityOutputStepBase";
import { localize } from "../../../../utils/localize";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class FilePathsVerifyStep extends ExecuteActivityOutputStepBase<WorkspaceDeploymentConfigurationContext> {
    public priority: number = 190;  /** Todo: Figure out a good priority level */

    // Todo: Add logic to verify that the file paths actually exist, if they don't, leave the corresponding context value as undefined
    protected async executeCore(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        this.options.shouldSwallowError = true;
        progress.report({ message: localize('verifyingFilePaths', 'Verifying file paths...') });

        const rootPath: string = nonNullProp(context, 'rootFolder').uri.fsPath;

        const configDockerfilePath = context.deploymentConfigurationSettings?.dockerfilePath;
        if (!context.dockerfilePath && configDockerfilePath) {
            context.dockerfilePath = path.join(rootPath, configDockerfilePath);
        }

        const configEnvPath = context.deploymentConfigurationSettings?.envPath;
        if (!context.envPath && configEnvPath) {
            context.envPath = path.join(rootPath, configEnvPath);
        }

        const configSrcPath = context.deploymentConfigurationSettings?.srcPath;
        if (!context.srcPath && configSrcPath) {
            context.srcPath = path.join(rootPath, configSrcPath);
        }
    }

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !!context.deploymentConfigurationSettings;
    }

    protected createSuccessOutput(_: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        // Todo: Finish this, if necessary
        return {};
    }

    protected createFailOutput(_: WorkspaceDeploymentConfigurationContext): ExecuteActivityOutput {
        // Todo: Finish this, if necessary
        return {};
    }
}
