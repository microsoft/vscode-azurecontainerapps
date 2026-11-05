/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, UserCancelledError } from '@microsoft/vscode-azext-utils';
import { commands, RelativePattern, workspace, type WorkspaceFolder } from 'vscode';
import { browseItem, dockerfileGlobPattern } from '../../../../constants';
import { addAzdTelemetryToContext } from '../../../../utils/azdUtils';
import { localize } from '../../../../utils/localize';
import { getRootWorkspaceFolder } from '../../../../utils/workspaceUtils';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

export class RootFolderStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        const prompt: string = localize('selectRootWorkspace', 'Select a project with a dockerfile (browsing to a folder will reload VS Code)');
        const rootFolder: WorkspaceFolder | undefined = await getRootWorkspaceFolder(context, prompt);

        let hasDockerfile = false;
        if (rootFolder) {
            const dockerfiles = await workspace.findFiles(new RelativePattern(rootFolder, `**/${dockerfileGlobPattern}`), undefined, 1);
            hasDockerfile = dockerfiles.length > 0;
        }

        if (!rootFolder || !hasDockerfile) {
            context.telemetry.properties.hasWorkspaceProjectOpen = rootFolder ? 'true' : 'false';
            const browsePrompt = rootFolder
                ? localize('selectWorkspaceWithDockerfile', 'No Dockerfile found in "{0}". Open a workspace project with a Dockerfile to continue (this will reload VS Code).', rootFolder.name)
                : prompt;

            await context.ui.showQuickPick([browseItem], { placeHolder: browsePrompt });
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
