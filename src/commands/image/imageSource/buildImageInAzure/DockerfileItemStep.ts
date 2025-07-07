/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep, nonNullValue, type FileActivityAttributes } from '@microsoft/vscode-azext-utils';
import { dockerFilePick, dockerfileGlobPattern } from "../../../../constants";
import { selectWorkspaceFile } from "../../../../utils/workspaceUtils";
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

const dockerfileAttributeName: string = 'Dockerfile';

export class DockerfileItemStep<T extends BuildImageInAzureImageSourceContext> extends AzureWizardPromptStep<T> {
    public async configureBeforePrompt(context: T): Promise<void> {
        if (context.dockerfilePath) {
            await this.addDockerfileAttributes(context, context.dockerfilePath);
        }
    }

    public async prompt(context: T): Promise<void> {
        context.dockerfilePath = nonNullValue(await selectWorkspaceFile(context, dockerFilePick, { filters: {}, autoSelectIfOne: true }, `**/${dockerfileGlobPattern}`));
        await this.addDockerfileAttributes(context, context.dockerfilePath);
    }

    public shouldPrompt(context: T): boolean {
        return !context.dockerfilePath;
    }

    private async addDockerfileAttributes(context: T, dockerfilePath: string): Promise<void> {
        if (context.activityAttributes?.files?.some(f => f.path === dockerfilePath)) {
            // If this dockerfile already exists in activity attributes, don't add it again
            return;
        }

        const dockerfile: FileActivityAttributes = {
            name: dockerfileAttributeName,
            description: 'A Dockerfile from the user\'s VS Code workspace that was used to build the project.',
            path: dockerfilePath,
            content: await AzExtFsExtra.readFile(dockerfilePath),
        };

        context.activityAttributes ??= {};
        context.activityAttributes.files ??= [];
        context.activityAttributes.files.push(dockerfile);
    }

    public undo(context: T): void {
        const files: FileActivityAttributes[] = context.activityAttributes?.files ?? [];
        if (files[files.length - 1]) {
            const lastFile = files[files.length - 1];
            if (lastFile.name === dockerfileAttributeName) {
                context.activityAttributes?.files?.pop();
            }
        }
    }
}
