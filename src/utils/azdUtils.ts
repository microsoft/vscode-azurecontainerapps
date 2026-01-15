/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, type IActionContext } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { extensions, type Extension, type WorkspaceFolder } from "vscode";

const azdExtensionId: string = 'ms-azuretools.azure-dev';
const azureYamlFile: string = 'azure.yaml';

export function isAzdExtensionInstalled(): boolean {
    const azdExtension: Extension<unknown> | undefined = extensions.getExtension(azdExtensionId);
     
    return !!azdExtension?.packageJSON?.version;
}

export async function isAzdWorkspaceProject(rootFolder: WorkspaceFolder): Promise<boolean> {
    const azureYamlPath: string = path.join(rootFolder.uri.fsPath, azureYamlFile);
    return await AzExtFsExtra.pathExists(azureYamlPath);
}

export async function addAzdTelemetryToContext(context: IActionContext, rootFolder?: WorkspaceFolder): Promise<void> {
    if (isAzdExtensionInstalled()) {
        context.telemetry.properties.isAzdExtensionInstalled = 'true';
    }

    if (rootFolder && await isAzdWorkspaceProject(rootFolder)) {
        context.telemetry.properties.isAzdWorkspaceProject = 'true';
    }
}
