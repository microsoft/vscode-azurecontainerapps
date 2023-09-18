/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { ConfigurationTarget, Uri, workspace, WorkspaceConfiguration, WorkspaceFolder } from "vscode";
import { settingsFile, vscodeFolder } from "../constants";
import { ext } from "../extensionVariables";

export namespace settingUtils {
    /**
     * Directly updates one of the user's `Global` configuration settings.
     * @param key The key of the setting to update
     * @param value The value of the setting to update
     * @param prefix The optional extension prefix. Uses ext.prefix `containerApps` unless otherwise specified
     */
    export async function updateGlobalSetting<T = string>(key: string, value: T, prefix: string = ext.prefix): Promise<void> {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix);
        await projectConfiguration.update(key, value, ConfigurationTarget.Global);
    }

    /**
     * Directly updates one of the user's `Workspace` or `WorkspaceFolder` settings.
     * @param key The key of the setting to update
     * @param value The value of the setting to update
     * @param fsPath The path of the workspace configuration settings
     * @param targetSetting The optional workspace setting to target. Uses the `Workspace` configuration target unless otherwise specified
     * @param prefix The optional extension prefix. Uses ext.prefix `containerApps` unless otherwise specified
     */
    export async function updateWorkspaceSetting<T = string>(
        key: string,
        value: T,
        fsPath: string,
        targetSetting: ConfigurationTarget.Workspace | ConfigurationTarget.WorkspaceFolder = ConfigurationTarget.Workspace,
        prefix: string = ext.prefix
    ): Promise<void> {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, Uri.file(fsPath));
        await projectConfiguration.update(key, value, targetSetting);
    }

    /**
     * Directly retrieves one of the user's `Global` configuration settings.
     * @param key The key of the setting to retrieve
     * @param prefix The optional extension prefix. Uses ext.prefix `containerApps` unless otherwise specified
     */
    export function getGlobalSetting<T>(key: string, prefix: string = ext.prefix): T | undefined {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix);
        const result: { globalValue?: T } | undefined = projectConfiguration.inspect<T>(key);
        return result && result.globalValue;
    }

    /**
     * Directly retrieves one of the user's `Workspace` or `WorkspaceFolder` settings.
     * @param key The key of the setting to retrieve
     * @param fsPath The optional path of the workspace configuration settings
     * @param targetSetting The optional workspace setting to target. Uses the `Workspace` configuration target unless otherwise specified
     * @param prefix The optional extension prefix. Uses ext.prefix `containerApps` unless otherwise specified
     */
    export function getWorkspaceSettingDirectly<T>(
        key: string,
        fsPath?: string,
        targetSetting: ConfigurationTarget.Workspace | ConfigurationTarget.WorkspaceFolder = ConfigurationTarget.Workspace,
        prefix: string = ext.prefix
    ): T | undefined {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, fsPath ? Uri.file(fsPath) : undefined);
        const result = projectConfiguration.inspect<T>(key);
        return result && targetSetting === ConfigurationTarget.Workspace ? result?.workspaceValue : result?.workspaceFolderValue;
    }

    /**
     * Iteratively retrieves one of the user's workspace settings - sequentially checking for a defined value starting from the `WorkspaceFolder` up to the provided target configuration limit.
     * @param key The key of the setting to retrieve
     * @param fsPath The optional path of the workspace configuration settings
     * @param targetLimit The optional target configuration limit (inclusive). Uses the `Workspace` configuration target unless otherwise specified
     * @param prefix The optional extension prefix. Uses ext.prefix `containerApps` unless otherwise specified
     */
    export function getWorkspaceSettingIteratively<T>(
        key: string,
        fsPath?: string,
        targetLimit: ConfigurationTarget.Workspace | ConfigurationTarget.WorkspaceFolder = ConfigurationTarget.Workspace,
        prefix: string = ext.prefix
    ): T | undefined {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, fsPath ? Uri.file(fsPath) : undefined);

        const configurationLevel: ConfigurationTarget | undefined = getLowestConfigurationLevel(projectConfiguration, key);
        if (targetLimit && configurationLevel && (configurationLevel < targetLimit)) {
            return undefined;
        }

        return projectConfiguration.get<T>(key);
    }

    /**
     * Searches through all open folders and gets the current workspace setting (as long as there are no conflicts)
     * Uses ext.prefix 'containerApps' unless otherwise specified
     */
    export function getWorkspaceSettingFromAnyFolder(key: string, prefix: string = ext.prefix): string | undefined {
        if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
            let result: string | undefined;
            for (const folder of workspace.workspaceFolders) {
                const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, folder.uri);
                const folderResult: string | undefined = projectConfiguration.get<string>(key);
                if (!result) {
                    result = folderResult;
                } else if (folderResult && result !== folderResult) {
                    return undefined;
                }
            }
            return result;
        } else {
            return getGlobalSetting(key, prefix);
        }
    }

    export function getDefaultRootWorkspaceSettingsPath(rootWorkspaceFolder: WorkspaceFolder): string {
        return path.join(rootWorkspaceFolder.uri.path, vscodeFolder, settingsFile);
    }

    function getLowestConfigurationLevel(projectConfiguration: WorkspaceConfiguration, key: string): ConfigurationTarget | undefined {
        const configuration = projectConfiguration.inspect(key);

        let lowestLevelConfiguration: ConfigurationTarget | undefined;
        if (configuration?.workspaceFolderValue !== undefined) {
            lowestLevelConfiguration = ConfigurationTarget.WorkspaceFolder;
        } else if (configuration?.workspaceValue !== undefined) {
            lowestLevelConfiguration = ConfigurationTarget.Workspace;
        } else if (configuration?.globalValue !== undefined) {
            lowestLevelConfiguration = ConfigurationTarget.Global;
        }

        return lowestLevelConfiguration;
    }
}
