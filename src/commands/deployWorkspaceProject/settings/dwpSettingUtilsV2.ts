/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfigurationTarget, type WorkspaceFolder } from "vscode";
import { settingUtils } from "../../../utils/settingUtils";
import { type DeployWorkspaceProjectSettingsV2, type DeploymentConfigurationSettings } from "./DeployWorkspaceProjectSettingsV2";

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

    export async function getDeployWorkspaceProjectSettings(rootFolder: WorkspaceFolder): Promise<DeployWorkspaceProjectSettingsV2> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);

        const sharedResourceGroup: string | undefined = settingUtils.getWorkspaceSetting('sharedResourceGroup', settingsPath);
        const sharedEnvironment: string | undefined = settingUtils.getWorkspaceSetting('sharedEnvironment', settingsPath);
        const sharedRegistry: string | undefined = settingUtils.getWorkspaceSetting('sharedRegistry', settingsPath);
        const deploymentConfigurations: DeploymentConfigurationSettings[] | undefined = settingUtils.getWorkspaceSetting<DeploymentConfigurationSettings[]>(deploymentConfigurationsSetting, settingsPath);

        return {
            sharedResourceGroup,
            sharedEnvironment,
            sharedRegistry,
            deploymentConfigurations,
        };
    }

    export async function setDeployWorkspaceProjectSettings(rootFolder: WorkspaceFolder, settings: DeployWorkspaceProjectSettingsV2): Promise<void> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
        for (const key of Object.keys(settings)) {
            await settingUtils.updateWorkspaceSetting(key, settings[key], settingsPath, ConfigurationTarget.WorkspaceFolder);
        }
    }
}
