/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type IAzureQuickPickItem } from '@microsoft/vscode-azext-utils';
import * as path from 'path';
import { browseItem } from '../../../../constants';
import { localize } from '../../../../utils/localize';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

export class SourcePathStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        const srcPath: string | undefined = (await context.ui.showQuickPick(await this.getPicks(context), {
            placeHolder: localize('sourceDirectoryPick', 'Choose your source code directory'),
            suppressPersistence: true
        })).data;

        context.srcPath = srcPath ?? (await context.ui.showOpenDialog({
            defaultUri: context.rootFolder?.uri,
            canSelectFiles: false,
            canSelectFolders: true
        }))[0].fsPath;
    }

    public async configureBeforePrompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        if (this.hasRootDockerfile(context)) {
            context.srcPath = context.rootFolder.uri.fsPath;
        }
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.srcPath;
    }

    private async getPicks(context: BuildImageInAzureImageSourceContext): Promise<IAzureQuickPickItem<string | undefined>[]> {
        const rootPath: string = context.rootFolder.uri.fsPath;
        const directories: string[] = path.relative(rootPath, path.dirname(context.dockerfilePath)).split(path.sep);
        const picks: IAzureQuickPickItem<string | undefined>[] = [{ label: '.' + path.sep, description: 'root', data: rootPath }];

        let p: string = '';
        for (const directory of directories) {
            p += path.sep + directory;
            picks.push({ label: '.' + p, data: rootPath + p });
        }

        (picks.at(-1) as IAzureQuickPickItem).description = 'dockerfile';
        picks.push(browseItem);
        return picks;
    }

    private hasRootDockerfile(context: BuildImageInAzureImageSourceContext): boolean {
        if (!context.rootFolder || !context.dockerfilePath) {
            return false;
        }

        const rootPath: string = context.rootFolder.uri.fsPath;
        return path.relative(rootPath, context.dockerfilePath) === path.basename(context.dockerfilePath);
    }
}
