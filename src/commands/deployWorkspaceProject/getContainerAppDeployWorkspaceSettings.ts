/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { WorkspaceFolder } from "vscode";
import { containerAppSettingsFile, vscodeFolder } from "../../constants";

export interface IDeployWorkspaceProjectSettings {
    // Container app names are unique to a resource group
    containerAppResourceGroupName: string;
    containerAppName: string;

    // Either unique globally or to a subscription
    acrName: string;
}

export async function getContainerAppDeployWorkspaceSettings(rootWorkspaceFolder: WorkspaceFolder): Promise<IDeployWorkspaceProjectSettings | undefined> {
    if (!rootWorkspaceFolder.uri.path) {
        return undefined;
    }

    const rootPath: string = rootWorkspaceFolder.uri.path;
    const settingsPath: string = path.join(rootPath, vscodeFolder, containerAppSettingsFile);

    try {
        return await AzExtFsExtra.pathExists(settingsPath) ? JSON.parse(await AzExtFsExtra.readFile(settingsPath)) as IDeployWorkspaceProjectSettings : undefined;
    } catch {
        return undefined;
    }
}
