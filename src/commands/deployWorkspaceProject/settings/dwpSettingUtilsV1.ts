/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfigurationTarget, type WorkspaceFolder } from "vscode";
import { relativeSettingsFilePath } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { localize } from "../../../utils/localize";
import { settingUtils } from "../../../utils/settingUtils";
import { type DeployWorkspaceProjectSettingsV1 } from "./DeployWorkspaceProjectSettingsV1";

export namespace dwpSettingUtilsV1 {
    const deployWorkspaceProjectPrefix: string = 'deployWorkspaceProject';

    export const containerAppSetting: string = `${deployWorkspaceProjectPrefix}.containerAppName`;
    export const containerAppResourceGroupSetting: string = `${deployWorkspaceProjectPrefix}.containerAppResourceGroupName`;
    export const containerRegistrySetting: string = `${deployWorkspaceProjectPrefix}.containerRegistryName`;

    export async function getDeployWorkspaceProjectSettings(rootFolder: WorkspaceFolder): Promise<DeployWorkspaceProjectSettingsV1> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);

        const containerAppName: string | undefined = settingUtils.getWorkspaceSetting(containerAppSetting, settingsPath);
        const containerAppResourceGroupName: string | undefined = settingUtils.getWorkspaceSetting(containerAppResourceGroupSetting, settingsPath);
        const containerRegistryName: string | undefined = settingUtils.getWorkspaceSetting(containerRegistrySetting, settingsPath);

        return {
            containerAppName,
            containerAppResourceGroupName,
            containerRegistryName
        };
    }

    /**
     * @throws Throws an error if the workspace configuration cannot be found in the default settings path
     */
    export async function setDeployWorkspaceProjectSettings(rootFolder: WorkspaceFolder, settings: DeployWorkspaceProjectSettingsV1): Promise<void> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
        for (const key of Object.keys(settings)) {
            await settingUtils.updateWorkspaceSetting(`${deployWorkspaceProjectPrefix}.${key}`, settings[key], settingsPath, ConfigurationTarget.WorkspaceFolder);
        }
    }

    export function displayDeployWorkspaceProjectSettingsOutput(settings: DeployWorkspaceProjectSettingsV1): void {
        if (hasAllDeployWorkspaceProjectSettings(settings)) {
            // Skip, more detailed logs will come when we confirm whether or not the resources were found
        } else if (hasAtLeastOneDeployWorkspaceProjectSetting(settings)) {
            ext.outputChannel.appendLog(localize('resourceSettingsIncomplete', 'Found incomplete container app workspace settings at "{0}".', relativeSettingsFilePath));
        } else {
            ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Found no container app workspace settings at "{0}".', relativeSettingsFilePath));
        }
    }

    export function hasAllDeployWorkspaceProjectSettings(settings: DeployWorkspaceProjectSettingsV1): boolean {
        return !!settings.containerAppName && !!settings.containerAppResourceGroupName && !!settings.containerRegistryName;
    }

    export function hasAtLeastOneDeployWorkspaceProjectSetting(settings: DeployWorkspaceProjectSettingsV1): boolean {
        return !!settings.containerAppName || !!settings.containerAppResourceGroupName || !!settings.containerRegistryName;
    }

    export function hasNoDeployWorkspaceProjectSettings(settings: DeployWorkspaceProjectSettingsV1): boolean {
        return !settings.containerAppName && !settings.containerAppResourceGroupName && !settings.containerRegistryName;
    }
}
