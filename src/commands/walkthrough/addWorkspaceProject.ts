/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, workspace } from "vscode";

export async function addWorkspaceProjectWalkthrough(): Promise<void> {
    workspace.updateWorkspaceFolders(0, workspace.workspaceFolders?.length ?? 0);
    await commands.executeCommand('git.clone');
}
