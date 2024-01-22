/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from "vscode";

export async function emptyWorkspaceWalkthrough(): Promise<void> {
    workspace.updateWorkspaceFolders(0, workspace.workspaceFolders?.length ?? 0);
}
