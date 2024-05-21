/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectSettingsV1, type DeploymentConfigurationSettings } from "../../../extension.bundle";
import { type StringOrRegExpProps } from "./StringOrRegExpProps";

export interface DotVSCodeTestSettings {
    containerAppResourceGroupName?: StringOrRegExpProps<Pick<DeployWorkspaceProjectSettingsV1, 'containerAppResourceGroupName'>>;
    containerAppName?: StringOrRegExpProps<Pick<DeployWorkspaceProjectSettingsV1, 'containerAppName'>>;
    containerRegistryName?: StringOrRegExpProps<Pick<DeployWorkspaceProjectSettingsV1, 'containerRegistryName'>>;
    deploymentConfigurations?: StringOrRegExpProps<DeploymentConfigurationSettings>[];
}
