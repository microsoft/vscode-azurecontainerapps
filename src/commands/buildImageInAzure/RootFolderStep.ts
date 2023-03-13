/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, UserCancelledError } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { localize } from '../../utils/localize';
import { IBuildImageContext } from './IBuildImageContext';

export class RootFolderStep extends AzureWizardPromptStep<IBuildImageContext> {
    public async prompt(context: IBuildImageContext): Promise<void> {
        context.rootFolder = await getRootWorkSpaceFolder();
    }

    public shouldPrompt(context: IBuildImageContext): boolean {
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
