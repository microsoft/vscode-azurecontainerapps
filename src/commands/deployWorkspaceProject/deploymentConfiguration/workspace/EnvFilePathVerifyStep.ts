/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type Progress } from "vscode";
import { FilePathsVerifyBaseStep } from "./FilePathsVerifyStepBase";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class EnvfilePathVerifyStep extends FilePathsVerifyBaseStep {
    public priority: number = 110; /** Todo: Figure out a good priority level */

    public async execute(context: WorkspaceDeploymentConfigurationContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        await this.executeCore(context, progress);
    }
}
