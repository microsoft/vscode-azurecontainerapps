/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import * as path from 'path';
import { browseItem } from '../../../../constants';
import { localize } from '../../../../utils/localize';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

export class SourcePathStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        await context.ui.showQuickPick([browseItem], {
            placeHolder: localize('sourceDirectoryPick', 'Choose your source code directory')
        });

        context.srcPath = (await context.ui.showOpenDialog({
            defaultUri: context.rootFolder?.uri,
            canSelectFiles: false,
            canSelectFolders: true
        }))[0].fsPath;
        context.telemetry.properties.sourceDepth = String(this.getRelativePathDepth(context.srcPath));
    }

    public async configureBeforePrompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        if (context.srcPath) {
            context.telemetry.properties.sourceDepth = String(this.getRelativePathDepth(context.srcPath));
        }
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.srcPath && !this.hasRootDockerfile(context);
    }

    // If a provided dockerfile is not at the project root, we need to acquire the project's source context
    private hasRootDockerfile(context: BuildImageInAzureImageSourceContext): boolean {
        if (!context.rootFolder || !context.dockerfilePath) {
            return false;
        }

        const rootPath: string = context.rootFolder.uri.fsPath;
        return path.relative(rootPath, context.dockerfilePath) === path.basename(context.dockerfilePath);
    }

    private getRelativePathDepth(relativePath: string): number {
        return relativePath === '.' ? 0 : relativePath.split(path.sep).length;
    }
}
