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
     * Uses ext.prefix 'containerApps' unless otherwise specified
     */
    export async function updateGlobalSetting<T = string>(section: string, value: T, prefix: string = ext.prefix): Promise<void> {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix);
        await projectConfiguration.update(section, value, ConfigurationTarget.Global);
    }

    /**
     * Uses ext.prefix 'containerApps' unless otherwise specified
     */
    export async function updateWorkspaceSetting<T = string>(section: string, value: T, fsPath: string, prefix: string = ext.prefix): Promise<void> {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, Uri.file(fsPath));
        await projectConfiguration.update(section, value, ConfigurationTarget.Workspace);
    }

    /**
 * Uses ext.prefix 'containerApps' unless otherwise specified
 */
    export async function updateWorkspaceFolderSetting<T = string>(section: string, value: T, fsPath: string, prefix: string = ext.prefix): Promise<void> {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, Uri.file(fsPath));
        await projectConfiguration.update(section, value, ConfigurationTarget.WorkspaceFolder);
    }

    /**
     * Uses ext.prefix 'containerApps' unless otherwise specified
     */
    export function getGlobalSetting<T>(key: string, prefix: string = ext.prefix): T | undefined {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix);
        const result: { globalValue?: T } | undefined = projectConfiguration.inspect<T>(key);
        return result && result.globalValue;
    }

    /**
     * Uses ext.prefix 'containerApps' unless otherwise specified
     */
    export function getWorkspaceSetting<T>(
        key: string,
        fsPath?: string,
        configurationTargetLimit?: ConfigurationTarget,
        prefix: string = ext.prefix
    ): T | undefined {
        const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(prefix, fsPath ? Uri.file(fsPath) : undefined);

        const configurationLevel: ConfigurationTarget | undefined = getLowestConfigurationLevel(projectConfiguration, key);
        if (configurationTargetLimit && configurationLevel && (configurationLevel < configurationTargetLimit)) {
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
