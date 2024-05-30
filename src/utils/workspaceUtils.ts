/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IActionContext, type IAzureQuickPickItem } from "@microsoft/vscode-azext-utils";
import { basename, relative } from "path";
import { RelativePattern, Uri, workspace, type OpenDialogOptions, type WorkspaceFolder } from "vscode";
import { browseItem, dockerfileGlobPattern, envFileGlobPattern } from "../constants";
import { type SetTelemetryProps } from "../telemetry/SetTelemetryProps";
import { type WorkspaceFileTelemetryProps as TelemetryProps } from "../telemetry/WorkspaceFileTelemetryProps";
import { localize } from "./localize";

interface SelectWorkspaceFileOptions extends OpenDialogOptions {
    /**
     * Include a 'skipForNow` option in the prompting.  Selection of `skipForNow` should correspond to a value of `undefined`
     */
    allowSkip?: boolean;
    /**
     * Optional label for the 'skipForNow' option; will default to 'Skip for now' if not provided
     */
    skipLabel?: string;
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
    context: IActionContext & SetTelemetryProps<TelemetryProps> & { rootFolder?: WorkspaceFolder },
    placeHolder: string,
    options: SelectWorkspaceFileOptions,
    globPattern?: string
): Promise<string | undefined> {
    if (!workspace.workspaceFolders?.length) {
        throw new Error(localize('noWorkspaceOpen', 'A workspace must be open to search.'));
    } else if (workspace.workspaceFolders.length > 1 && !context.rootFolder) {
        throw new Error(localize('couldNotDetermineWorkspaceFolder', 'Could not determine which workspace folder to search.'));
    }

    const relativePattern: RelativePattern = new RelativePattern(
        context.rootFolder ?? workspace.workspaceFolders[0],
        globPattern ?? '**/*'
    );
    const files = await workspace.findFiles(relativePattern);

    // If dockerfile(s), log the count
    if (globPattern === dockerfileGlobPattern || globPattern === `**/${dockerfileGlobPattern}`) {
        context.telemetry.properties.dockerfileCount = String(files.length);
    }

    // If environment variable file(s), log the count
    if (globPattern === envFileGlobPattern || globPattern === `**/${envFileGlobPattern}`) {
        context.telemetry.properties.environmentVariableFileCount = String(files.length);
    }

    if (options.autoSelectIfOne && files.length === 1) {
        return files[0].fsPath;
    }

    const quickPicks: IAzureQuickPickItem<string | undefined>[] = [];
    quickPicks.push(...files.map((uri: Uri) => {
        return {
            label: basename(uri.path),
            description: relative(relativePattern.baseUri.path, uri.path),
            data: uri.fsPath
        };
    }));
    quickPicks.push(browseItem);

    const skipForNow: string = 'skipForNow';
    if (options.allowSkip) {
        quickPicks.push({
            label: options.skipLabel ?? localize('skipForNow', '$(clock) Skip for now'),
            description: '',
            data: skipForNow
        });
    }

    const input: string | undefined = (await context.ui.showQuickPick(quickPicks, { placeHolder })).data;
    if (input === skipForNow) {
        return undefined;
    } else {
        return input || (await context.ui.showOpenDialog(options))[0].fsPath;
    }
}

export async function getRootWorkspaceFolder(context: IActionContext, placeHolder?: string): Promise<WorkspaceFolder | undefined> {
    if (!workspace.workspaceFolders?.length) {
        return undefined;
    } else if (workspace.workspaceFolders?.length === 1) {
        return workspace.workspaceFolders[0];
    } else {
        return await context.ui.showWorkspaceFolderPick({ placeHolder });
    }
}

export function getWorkspaceFolderFromPath(path: string): WorkspaceFolder | undefined {
    return workspace.workspaceFolders?.find(folder => folder.uri.fsPath === Uri.file(path).fsPath);
}
