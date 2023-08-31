/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfigurationTarget, WorkspaceFolder } from "vscode";
import { settingUtils } from "../../utils/settingUtils";

export interface IDeployWorkspaceProjectSettings {
    // Container app names are unique to a resource group
    containerAppResourceGroupName?: string;
    containerAppName?: string;

    // Either unique globally or to a subscription
    containerRegistryName?: string;
}

const deployWorkspaceProjectPrefix: string = 'deployWorkspaceProject';

export async function getDeployWorkspaceProjectSettings(rootFolder: WorkspaceFolder): Promise<IDeployWorkspaceProjectSettings | undefined> {
    const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);

    try {
        const containerAppName: string | undefined = settingUtils.getWorkspaceSetting(`${deployWorkspaceProjectPrefix}.containerAppName`, settingsPath, ConfigurationTarget.Workspace);
        const containerAppResourceGroupName: string | undefined = settingUtils.getWorkspaceSetting(`${deployWorkspaceProjectPrefix}.containerAppResourceGroupName`, settingsPath, ConfigurationTarget.Workspace);
        const containerRegistryName: string | undefined = settingUtils.getWorkspaceSetting(`${deployWorkspaceProjectPrefix}.containerRegistryName`, settingsPath, ConfigurationTarget.Workspace);

        if (containerAppName || containerAppResourceGroupName || containerRegistryName) {
            return {
                containerAppName,
                containerAppResourceGroupName,
                containerRegistryName
            };
        }
    } catch { /** Do nothing */ }

    return undefined;
}

/**
 * @throws Throws an error if the workspace configuration cannot be found in the default settings path
 */
export async function setDeployWorkspaceProjectSettings(rootFolder: WorkspaceFolder, settings: IDeployWorkspaceProjectSettings): Promise<void> {
    const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
    for (const key of Object.keys(settings)) {
        await settingUtils.updateWorkspaceSetting(`${deployWorkspaceProjectPrefix}.${key}`, settings[key], settingsPath);
    }
}
