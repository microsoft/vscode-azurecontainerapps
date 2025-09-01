/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parseError, UserCancelledError, type IActionContext, type IParsedError } from "@microsoft/vscode-azext-utils";
import { commands, workspace, type MessageItem } from "vscode";
import { localize } from "../../utils/localize";

export async function addWorkspaceProjectWalkthrough(context: IActionContext): Promise<void> {
    if (workspace.workspaceFolders?.length) {
        const warning: string = localize('workspaceWarning', 'This tutorial requires that you start from an empty workspace.\n\nPress continue to reset your current workspace.');

        const items: MessageItem[] = [{ title: localize('continue', 'Continue') }];
        await context.ui.showWarningMessage(warning, { modal: true, stepName: 'addWorkspaceProject.emptyWorkspace' }, ...items);

        workspace.updateWorkspaceFolders(0, workspace.workspaceFolders.length);
        throw new UserCancelledError();
    }

    try {
        await commands.executeCommand('git.clone');
    } catch (e) {
        const perr: IParsedError = parseError(e);
        if (/git\.clone.*not found/i.test(perr.message)) {
            throw new Error(localize('gitCloneNotFound', 'Command "git.clone" not found. This could be due to one of the following reasons:\n\n- Git is not installed on your system.\n- Git is installed but not added to your system PATH.\n- Git is installed but is broken or permission-blocked.\n\nPlease ensure Git is installed and properly configured.'));
        }
        throw e;
    }
}
