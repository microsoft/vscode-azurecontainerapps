/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "@microsoft/vscode-azext-utils";
import { ConfigurationTarget, type WorkspaceFolder } from "vscode";
import { relativeSettingsFilePath } from "../../constants";
import { ext } from "../../extensionVariables";
import type { SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import type { DeployWorkspaceProjectTelemetryProps as TelemetryProps } from "../../telemetry/telemetryProps";
import { localize } from "../../utils/localize";
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

export function setDeployWorkspaceProjectSettingsTelemetry(context: IActionContext & SetTelemetryProps<TelemetryProps>, settings: DeployWorkspaceProjectSettings): void {
    if (hasAllDeployWorkspaceProjectSettings(settings)) {
        context.telemetry.properties.workspaceSettingsState = 'all';
    } else if (hasAtLeastOneDeployWorkspaceProjectSetting(settings)) {
        context.telemetry.properties.workspaceSettingsState = 'partial';
    } else {
        context.telemetry.properties.workspaceSettingsState = 'none';
    }
}

export function displayDeployWorkspaceProjectSettingsOutput(settings: DeployWorkspaceProjectSettings): void {
    if (hasAllDeployWorkspaceProjectSettings(settings)) {
        // Skip, more detailed logs will come when we confirm whether or not the resources were found
    } else if (hasAtLeastOneDeployWorkspaceProjectSetting(settings)) {
        ext.outputChannel.appendLog(localize('resourceSettingsIncomplete', 'Found incomplete container app workspace settings at "{0}".', relativeSettingsFilePath));
    } else {
        ext.outputChannel.appendLog(localize('noWorkspaceSettings', 'Found no container app workspace settings at "{0}".', relativeSettingsFilePath));
    }
}

export function hasAllDeployWorkspaceProjectSettings(settings: DeployWorkspaceProjectSettings): boolean {
    return !!settings.containerAppName && !!settings.containerAppResourceGroupName && !!settings.containerRegistryName;
}

export function hasAtLeastOneDeployWorkspaceProjectSetting(settings: DeployWorkspaceProjectSettings): boolean {
    return !!settings.containerAppName || !!settings.containerAppResourceGroupName || !!settings.containerRegistryName;
}

export function hasNoDeployWorkspaceProjectSettings(settings: DeployWorkspaceProjectSettings): boolean {
    return !settings.containerAppName && !settings.containerAppResourceGroupName && !settings.containerRegistryName;
}
