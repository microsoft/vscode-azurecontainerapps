/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { FilePathsVerifyStep } from "./FilePathsVerifyStep";
import { type WorkspaceDeploymentConfigurationContext } from "./WorkspaceDeploymentConfigurationContext";

export class EnvValidateStep extends FilePathsVerifyStep {
    priority: number = 120;

    key = 'envPath';
    fileType = '.env file';

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.envPath;
    }
}
