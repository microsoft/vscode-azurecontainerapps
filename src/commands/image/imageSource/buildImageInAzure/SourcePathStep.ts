/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import * as path from 'path';
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

export class SourcePathStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        context.srcPath = 'Placeholder';
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.srcPath && !this.hasRootDockerfile(context);
    }

    // If a provided dockerfile is not at the project root, we need to acquire the project's source context
    private hasRootDockerfile(context: BuildImageInAzureImageSourceContext): boolean {
        if (!context.rootFolder || !context.dockerfilePath) {
            return false;
        }

        const rootPath: string = context.rootFolder.uri.path;
        // Try something with path.relative instead?
        return path.join(rootPath, path.basename(context.dockerfilePath)) === path.normalize(context.dockerfilePath);
    }
}
