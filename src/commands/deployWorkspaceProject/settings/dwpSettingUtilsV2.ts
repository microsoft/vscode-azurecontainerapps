/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type WorkspaceFolder } from "vscode";
import { settingUtils } from "../../../utils/settingUtils";
import { type DeploymentConfigurationSettings } from "./DeployWorkspaceProjectSettingsV2";

export namespace dwpSettingUtilsV2 {
    export async function getWorkspaceDeploymentConfigurations(rootFolder: WorkspaceFolder): Promise<DeploymentConfigurationSettings[] | undefined> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
        const deploymentConfigurations: DeploymentConfigurationSettings[] | undefined = settingUtils.getWorkspaceSetting('deploymentConfigurations', settingsPath);
        return deploymentConfigurations;
    }
}
