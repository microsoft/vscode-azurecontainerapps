/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfigurationTarget, type WorkspaceFolder } from "vscode";
import { settingUtils } from "../../../utils/settingUtils";
import { type DeploymentConfigurationSettings } from "./DeployWorkspaceProjectSettingsV2";

export namespace dwpSettingUtilsV2 {
    const deploymentConfigurationsSetting: string = 'deploymentConfigurations';

    export async function getWorkspaceDeploymentConfigurations(rootFolder: WorkspaceFolder): Promise<DeploymentConfigurationSettings[] | undefined> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
        return settingUtils.getWorkspaceSetting(deploymentConfigurationsSetting, settingsPath);
    }

    export async function setWorkspaceDeploymentConfigurations(rootFolder: WorkspaceFolder, deploymentConfigurations: DeploymentConfigurationSettings[]): Promise<void> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
        await settingUtils.updateWorkspaceSetting(deploymentConfigurationsSetting, deploymentConfigurations, settingsPath, ConfigurationTarget.WorkspaceFolder);
    }

    /**
     * @throws Throws an error if the workspace configuration cannot be found in the default settings path
     */
    export async function setDeployWorkspaceProjectSettingsV2(key: string, rootFolder: WorkspaceFolder, settings: DeploymentConfigurationSettings[] | undefined): Promise<void> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
        await settingUtils.updateWorkspaceSetting(key, settings, settingsPath, ConfigurationTarget.WorkspaceFolder);
    }
}
