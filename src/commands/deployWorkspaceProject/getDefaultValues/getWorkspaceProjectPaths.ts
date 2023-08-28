/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext, UserCancelledError, nonNullValue } from "@microsoft/vscode-azext-utils";
import { Uri, WorkspaceFolder, commands, workspace } from "vscode";
import { DOCKERFILE_GLOB_PATTERN } from "../../../constants";
import { localize } from "../../../utils/localize";
import { browseItem, getRootWorkspaceFolder } from "../../../utils/workspaceUtils";

export async function getWorkspaceProjectPaths(context: IActionContext): Promise<{ rootFolder: WorkspaceFolder, dockerfilePath: string }> {
    const prompt: string = localize('selectRootWorkspace', 'Select a project with a Dockerfile');
    const rootFolder: WorkspaceFolder | undefined = await getRootWorkspaceFolder(prompt);

    if (!rootFolder) {
        await context.ui.showQuickPick([browseItem], { placeHolder: prompt });
        await commands.executeCommand('vscode.openFolder');

        // Silently throw an exception to exit the command while VS Code reloads the new workspace
        throw new UserCancelledError();
    }

    // Check if chosen workspace has a Dockerfile at its root
    const dockerfileUris: Uri[] = await workspace.findFiles(DOCKERFILE_GLOB_PATTERN);
    if (!dockerfileUris.length) {
        throw new Error(localize('noDockerfileError', 'Unable to locate a Dockerfile in your project\'s root.'));
    } else if (dockerfileUris.length > 1) {
        throw new Error(localize('multipleDockerfileError', 'Multiple Dockerfiles found. Unable to determine the correct Dockerfile to use in your project\'s root.'));
    }

    return {
        rootFolder: nonNullValue(rootFolder),
        dockerfilePath: dockerfileUris[0].path
    };
}
