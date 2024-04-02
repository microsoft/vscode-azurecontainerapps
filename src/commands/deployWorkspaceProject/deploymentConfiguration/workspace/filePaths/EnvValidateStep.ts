/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type WorkspaceDeploymentConfigurationContext } from "../WorkspaceDeploymentConfigurationContext";
import { FilePathsVerifyStep } from "./FilePathsVerifyStep";

export class EnvValidateStep extends FilePathsVerifyStep {
    priority: number = 120;

    deploymentSettingskey = 'envPath' as const;
    contextKey = 'envPath' as const;
    fileType = 'environment variables';

    public shouldExecute(context: WorkspaceDeploymentConfigurationContext): boolean {
        return !context.envPath;
    }
}
