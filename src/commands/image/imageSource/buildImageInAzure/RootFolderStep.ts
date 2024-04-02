/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, UserCancelledError } from '@microsoft/vscode-azext-utils';
import { commands, type WorkspaceFolder } from 'vscode';
import { browseItem } from '../../../../constants';
import { addAzdTelemetryToContext } from '../../../../utils/azdUtils';
import { localize } from '../../../../utils/localize';
import { getRootWorkspaceFolder } from '../../../../utils/workspaceUtils';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

export class RootFolderStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
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

        context.rootFolder = rootFolder;
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.rootFolder;
    }
}
