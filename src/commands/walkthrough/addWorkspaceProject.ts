/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext } from "@microsoft/vscode-azext-utils";
import { commands, workspace, type MessageItem } from "vscode";
import { localize } from "../../utils/localize";

export async function addWorkspaceProjectWalkthrough(context: IActionContext): Promise<void> {
    if (workspace.workspaceFolders?.length) {
        const warning: string = localize('workspaceWarning', 'Detected existing workspace content. You must start from an empty workspace.\n\nPress continue to reset your current workspace.');

        const items: MessageItem[] = [{ title: localize('continue', 'Continue') }];
        await context.ui.showWarningMessage(warning, { modal: true, stepName: 'addWorkspaceProject.emptyWorkspace' }, ...items);

        workspace.updateWorkspaceFolders(0, workspace.workspaceFolders.length);
    }

    await commands.executeCommand('git.clone');
}
