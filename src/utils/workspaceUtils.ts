/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, IAzureQuickPickItem, UserCancelledError } from "@microsoft/vscode-azext-utils";
import * as path from "path";
import { OpenDialogOptions, Uri, WorkspaceFolder, window, workspace } from "vscode";
import { browseItem } from "../constants";
import { localize } from "./localize";

/**
 * Opens a quick pick menu with files matching the file extension filters provided, otherwise shows files in the current workspace.
 *
 * @returns Returns a string representing the workspace file path chosen.  A return of undefined is only possible when the `allowSkip` option is set to true.
 */
export async function selectWorkspaceFile(context: IActionContext, placeHolder: string, options: OpenDialogOptions & { allowSkip?: boolean }, globPattern?: string): Promise<string | undefined> {
    let input: IAzureQuickPickItem<string | undefined> | undefined;
    const quickPicks: IAzureQuickPickItem<string | undefined>[] = [];
    const skipForNow: string = 'skipForNow';

    if (workspace.workspaceFolders?.length === 1) {
        // if there's a fileExtension, then only populate the quickPick menu with that, otherwise show the current folders in the workspace
        const files = globPattern ? await workspace.findFiles(globPattern) : await workspace.findFiles('**/*');
        quickPicks.push(...files.map((uri: Uri) => {
            return {
                label: path.basename(uri.path),
                description: uri.path,
                data: uri.path
            };
        }));

        quickPicks.push(browseItem);

        if (options.allowSkip) {
            quickPicks.push({
                label: localize('skipForNow', '$(clock) Skip for now'),
                description: '',
                data: skipForNow
            });
        }

        input = await context.ui.showQuickPick(quickPicks, { placeHolder });
    }

    if (input?.data === skipForNow) {
        return undefined;
    } else {
        return input?.data || (await context.ui.showOpenDialog(options))[0].path;
    }
}

export async function getRootWorkspaceFolder(placeHolder?: string): Promise<WorkspaceFolder | undefined> {
    if (!workspace.workspaceFolders?.length) {
        return undefined;
    } else if (workspace.workspaceFolders?.length === 1) {
        return workspace.workspaceFolders[0];
    } else {
        const folder = await window.showWorkspaceFolderPick({ placeHolder: placeHolder ?? localize('selectRootWorkspace', 'Select a folder for your workspace') });
        if (!folder) {
            throw new UserCancelledError('selectRootWorkspace');
        }
        return folder;
    }
}
