/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface DeployWorkspaceProjectSettingsV2 {
    sharedResourceGroup?: string;
    sharedEnvironment?: string;
    sharedRegistry?: string;
    deploymentConfigurations?: DeploymentConfigurationSettings[];
}

export interface DeploymentConfigurationSettings {
    label?: string;
    type?: string;
    dockerfilePath?: string;
    srcPath?: string;
    envPath?: string;
    containerApp?: string;
}
