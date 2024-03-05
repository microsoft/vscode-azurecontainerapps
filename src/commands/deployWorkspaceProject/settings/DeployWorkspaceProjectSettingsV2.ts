/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface DeployWorkspaceProjectSettingsV2 {
    deploymentConfigurations?: DeploymentConfigurationSetting[];
}

export interface DeploymentConfigurationSetting {
    label?: string;
    type?: string;
    dockerfilePath?: string;
    srcPath?: string;
    envPath?: string;
    resourceGroup?: string;
    containerApp?: string;
    containerRegistry?: string;
}
