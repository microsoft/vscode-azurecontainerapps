/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { AzureWizardPromptStep, UserCancelledError } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { isAzdWorkspaceProject } from '../../../../utils/azdUtils';
import { localize } from '../../../../utils/localize';
import { BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

export class RootFolderStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        context.rootFolder = await getRootWorkSpaceFolder();

        if (await isAzdWorkspaceProject(context.rootFolder)) {
            context.telemetry.properties.isAzdWorkspaceProject = 'true';
        }
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.rootFolder;
    }
}

async function getRootWorkSpaceFolder(): Promise<vscode.WorkspaceFolder> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        throw new Error(localize('noOpenFolder', 'No folder is open. Please open a folder and try again.'));
    } else if (vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    } else {
        const placeHolder: string = localize('selectRootWorkspace', 'Select the folder containing your Dockerfile');
        const folder = await vscode.window.showWorkspaceFolderPick({ placeHolder });
        if (!folder) {
            throw new UserCancelledError('selectRootWorkspace');
        }
        return folder;
    }
}
