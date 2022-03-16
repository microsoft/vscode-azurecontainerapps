/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { basename } from 'path';
import { OpenDialogOptions, Uri, workspace } from "vscode";
import { IActionContext, IAzureQuickPickItem } from "vscode-azureextensionui";
import { localize } from "./localize";

export async function selectWorkspaceFile(context: IActionContext, placeHolder: string, options: OpenDialogOptions, globPattern?: string): Promise<string> {
    let input: IAzureQuickPickItem<string | undefined> | undefined;
    let quickPicks: IAzureQuickPickItem<string | undefined>[] = [];
    if (workspace.workspaceFolders?.length === 1) {
        // if there's a fileExtension, then only populate the quickPick menu with that, otherwise show the current folders in the workspace
        const files = globPattern ? await workspace.findFiles(globPattern) : await workspace.findFiles('**/*');
        quickPicks = files.map((uri: Uri) => {
            return {
                label: basename(uri.fsPath),
                description: uri.fsPath,
                data: uri.fsPath
            };
        });

        quickPicks.push({ label: `$(file-directory) ${localize('browse', 'Browse...')}`, description: '', data: undefined });
        input = await context.ui.showQuickPick(quickPicks, { placeHolder });
    }

    return input?.data || (await context.ui.showOpenDialog(options))[0].fsPath;
}
