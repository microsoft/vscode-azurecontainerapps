/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type WorkspaceDeploymentConfigurationContext } from "../WorkspaceDeploymentConfigurationContext";
import { FilePathsVerifyStep } from "./FilePathsVerifyStep";

export class DockerfileValidateStep extends FilePathsVerifyStep {
    priority: number = 100;

    deploymentSettingskey = 'dockerfilePath' as const;
    contextKey = 'dockerfilePath' as const;
    fileType = 'dockerfile';

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.dockerfilePath;
    }
}
