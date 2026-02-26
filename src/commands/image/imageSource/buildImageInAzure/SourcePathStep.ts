/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, type IAzureQuickPickItem } from '@microsoft/vscode-azext-utils';
import * as path from 'path';
import { browseItem } from '../../../../constants';
import { localize } from '../../../../utils/localize';
import { quickPickWithBrowse } from '../../../../utils/workspaceUtils';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

export class SourcePathStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        const srcPath = await quickPickWithBrowse(
            context,
            this.getPicks(context),
            {
                placeHolder: localize('sourceDirectoryPick', 'Choose your source code directory'),
                suppressPersistence: true,
            },
            {
                defaultUri: context.rootFolder?.uri,
                canSelectFiles: false,
                canSelectFolders: true,
            },
        );

        if (srcPath) {
            context.srcPath = srcPath;
        }
    }

    public async configureBeforePrompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        if (this.hasRootDockerfile(context)) {
            context.srcPath = context.rootFolder.uri.fsPath;
        }
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.srcPath;
    }

    private getPicks(context: BuildImageInAzureImageSourceContext): IAzureQuickPickItem<string | undefined>[] {
        const rootPath: string = context.rootFolder.uri.fsPath;
        const directories: string[] = path.relative(rootPath, path.dirname(context.dockerfilePath)).split(path.sep);
        const picks: IAzureQuickPickItem<string | undefined>[] = [{ label: '.' + path.sep, data: rootPath }];

        let p: string = '';
        for (const directory of directories) {
            p += path.sep + directory;
            picks.push({ label: '.' + p, data: rootPath + p });
        }

        picks.reverse();
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
