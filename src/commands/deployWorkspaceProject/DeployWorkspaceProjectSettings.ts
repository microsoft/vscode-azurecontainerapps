/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { WorkspaceFolder } from "vscode";
import { settingUtils } from "../../utils/settingUtils";

export interface DeployWorkspaceProjectSettings {
    // Container app names are unique to a resource group
    containerAppResourceGroupName?: string;
    containerAppName?: string;

    containerRegistryName?: string;
}

const deployWorkspaceProjectPrefix: string = 'deployWorkspaceProject';

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
