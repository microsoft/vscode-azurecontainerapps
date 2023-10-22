/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IActionContext, UserCancelledError, nonNullValue } from "@microsoft/vscode-azext-utils";
import { WorkspaceFolder, commands } from "vscode";
import { browseItem, dockerfileGlobPattern } from "../../../constants";
import { addAzdTelemetryToContext } from "../../../utils/azdUtils";
import { localize } from "../../../utils/localize";
import { getRootWorkspaceFolder, selectWorkspaceFile } from "../../../utils/workspaceUtils";

export async function getWorkspaceProjectPaths(context: IActionContext): Promise<{ rootFolder: WorkspaceFolder, dockerfilePath: string }> {
    const prompt: string = localize('selectRootWorkspace', 'Select a project with a Dockerfile');
    const rootFolder: WorkspaceFolder | undefined = await getRootWorkspaceFolder(prompt);

    if (!rootFolder) {
        context.telemetry.properties.hasWorkspaceProjectOpen = 'false';

        await context.ui.showQuickPick([browseItem], { placeHolder: prompt });
        await commands.executeCommand('vscode.openFolder');

        // Silently throw an exception to exit the command while VS Code reloads the new workspace
        throw new UserCancelledError();
    }

    await addAzdTelemetryToContext(context, rootFolder);

    return {
        rootFolder: nonNullValue(rootFolder),
        dockerfilePath: nonNullValue(await selectWorkspaceFile(context, localize('dockerFilePick', 'Select a Dockerfile'), { filters: {}, autoSelectIfOne: true }, `**/${dockerfileGlobPattern}`))
    };
}
