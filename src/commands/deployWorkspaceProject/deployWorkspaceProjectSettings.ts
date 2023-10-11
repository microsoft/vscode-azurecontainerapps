/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfigurationTarget, type WorkspaceFolder } from "vscode";
import { settingUtils } from "../../utils/settingUtils";

export interface DeployWorkspaceProjectSettings {
    // Container app names are unique to a resource group
    containerAppResourceGroupName?: string;
    containerAppName?: string;

    containerRegistryName?: string;
}

export const deployWorkspaceProjectPrefix: string = 'deployWorkspaceProject';

export async function getDeployWorkspaceProjectSettings(rootFolder: WorkspaceFolder): Promise<DeployWorkspaceProjectSettings> {
    const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);

    const containerAppName: string | undefined = settingUtils.getWorkspaceSetting(`${deployWorkspaceProjectPrefix}.containerAppName`, settingsPath);
    const containerAppResourceGroupName: string | undefined = settingUtils.getWorkspaceSetting(`${deployWorkspaceProjectPrefix}.containerAppResourceGroupName`, settingsPath);
    const containerRegistryName: string | undefined = settingUtils.getWorkspaceSetting(`${deployWorkspaceProjectPrefix}.containerRegistryName`, settingsPath);

    return {
        containerAppName,
        containerAppResourceGroupName,
        containerRegistryName
    };
}

/**
 * @throws Throws an error if the workspace configuration cannot be found in the default settings path
 */
export async function setDeployWorkspaceProjectSettings(rootFolder: WorkspaceFolder, settings: DeployWorkspaceProjectSettings): Promise<void> {
    const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
    for (const key of Object.keys(settings)) {
        await settingUtils.updateWorkspaceSetting(`${deployWorkspaceProjectPrefix}.${key}`, settings[key], settingsPath, ConfigurationTarget.WorkspaceFolder);
    }
}
