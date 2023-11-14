/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { UserCancelledError, nonNullValue, type IActionContext } from "@microsoft/vscode-azext-utils";
import { commands, type WorkspaceFolder } from "vscode";
import { browseItem, dockerFilePick, dockerfileGlobPattern } from "../../../constants";
import { type SetTelemetryProps } from "../../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectTelemetryProps as TelemetryProps } from "../../../telemetry/commandTelemetryProps";
import { addAzdTelemetryToContext } from "../../../utils/azdUtils";
import { localize } from "../../../utils/localize";
import { getRootWorkspaceFolder, selectWorkspaceFile } from "../../../utils/workspaceUtils";

export async function getWorkspaceProjectPaths(context: IActionContext & SetTelemetryProps<TelemetryProps>): Promise<{ rootFolder: WorkspaceFolder, dockerfilePath: string }> {
    const prompt: string = localize('selectRootWorkspace', 'Select a project with a Dockerfile');
    const rootFolder: WorkspaceFolder | undefined = await getRootWorkspaceFolder(prompt);

    if (!rootFolder) {
        context.telemetry.properties.hasWorkspaceProjectOpen = 'false';

        await context.ui.showQuickPick([browseItem], { placeHolder: prompt });
        await commands.executeCommand('vscode.openFolder');

        // Silently throw an exception to exit the command while VS Code reloads the new workspace
        throw new UserCancelledError();
    }

    context.telemetry.properties.hasWorkspaceProjectOpen = 'true';
    await addAzdTelemetryToContext(context, rootFolder);

    return {
        rootFolder: nonNullValue(rootFolder),
        dockerfilePath: nonNullValue(await selectWorkspaceFile(context, dockerFilePick, { filters: {}, autoSelectIfOne: true }, `**/${dockerfileGlobPattern}`))
    };
}
