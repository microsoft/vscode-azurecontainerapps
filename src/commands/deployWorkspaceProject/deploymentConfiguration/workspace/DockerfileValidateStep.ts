/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { FilePathsVerifyStep } from "./FilePathsVerifyStep";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class DockerfileValidateStep extends FilePathsVerifyStep {
    priority: number = 100;

    key = 'dockerfilePath';
    fileType = 'dockerfile';

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.dockerfilePath
    }
}
