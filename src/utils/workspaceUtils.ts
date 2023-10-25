/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext, IAzureQuickPickItem, UserCancelledError } from "@microsoft/vscode-azext-utils";
import { basename } from "path";
import { OpenDialogOptions, Uri, WorkspaceFolder, window, workspace } from "vscode";
import { browseItem, dockerfileGlobPattern, envGlobPattern } from "../constants";
import { SetTelemetryProps } from "../telemetry/SetTelemetryProps";
import { WorkspaceFileTelemetryProps as TelemetryProps } from "../telemetry/WorkspaceFileTelemetryProps";
import { localize } from "./localize";

interface SelectWorkspaceFileOptions extends OpenDialogOptions {
    /**
     * Include a 'skipForNow` option in the prompting.  Selection of `skipForNow` should correspond to a value of `undefined`
     */
    allowSkip?: boolean;
    /**
     * If searching through the workspace file path returns only one matching result, automatically return its path without additional prompting
     */
    autoSelectIfOne?: boolean;
}

/**
 * Opens a quick pick menu with files matching the file extension filters provided, otherwise shows files in the current workspace.
 *
 * @returns Returns a string representing the workspace file path chosen.  A return of undefined is only possible when the `allowSkip` option is set to true.
 */
export async function selectWorkspaceFile(
    context: IActionContext & SetTelemetryProps<TelemetryProps>,
    placeHolder: string,
    options: SelectWorkspaceFileOptions,
    globPattern?: string
): Promise<string | undefined> {
    let input: IAzureQuickPickItem<string | undefined> | undefined;
    const quickPicks: IAzureQuickPickItem<string | undefined>[] = [];
    const skipForNow: string = 'skipForNow';

    if (workspace.workspaceFolders?.length === 1) {
        // if there's a fileExtension, then only populate the quickPick menu with that, otherwise show the current folders in the workspace
        const files = globPattern ? await workspace.findFiles(globPattern) : await workspace.findFiles('**/*');

        context.telemetry.properties.dockerfileCount = '0';
        context.telemetry.properties.environmentVariableFileCount = '0';

        // If dockerfile(s), log the count
        if (globPattern === dockerfileGlobPattern || globPattern === `**/${dockerfileGlobPattern}`) {
            context.telemetry.properties.dockerfileCount = String(files.length);
        }

        // If environment variable file(s), log the count
        if (globPattern === envGlobPattern || globPattern === `**/${envGlobPattern}`) {
            context.telemetry.properties.environmentVariableFileCount = String(files.length);
        }

        if (options.autoSelectIfOne && files.length === 1) {
            return files[0].path;
        }

        quickPicks.push(...files.map((uri: Uri) => {
            return {
                label: basename(uri.path),
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
