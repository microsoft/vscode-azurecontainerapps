/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, workspace } from "vscode";

export async function clearWorkspace(): Promise<void> {
    await commands.executeCommand('workbench.view.explorer');

    const workspaceFolders = workspace.workspaceFolders;
    if (!workspaceFolders?.length) {
        return;
    }

    for (let i = 0; i < workspaceFolders.length; i++) {
        await commands.executeCommand('workbench.action.removeRootFolder');
    }
}
