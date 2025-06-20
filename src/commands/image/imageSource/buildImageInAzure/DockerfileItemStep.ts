/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra, AzureWizardPromptStep, nonNullValue, type FileActivityAttributes } from '@microsoft/vscode-azext-utils';
import { dockerFilePick, dockerfileGlobPattern } from "../../../../constants";
import { selectWorkspaceFile } from "../../../../utils/workspaceUtils";
import { type BuildImageInAzureImageSourceContext } from './BuildImageInAzureImageSourceContext';

export class DockerfileItemStep<T extends BuildImageInAzureImageSourceContext> extends AzureWizardPromptStep<T> {
    public async prompt(context: T): Promise<void> {
        context.dockerfilePath = nonNullValue(await selectWorkspaceFile(context, dockerFilePick, { filters: {}, autoSelectIfOne: true }, `**/${dockerfileGlobPattern}`));
        await this.addDockerfileAttributes(context, context.dockerfilePath);
    }

    public shouldPrompt(context: T): boolean {
        return !context.dockerfilePath;
    }

    private async addDockerfileAttributes(context: T, dockerfilePath: string): Promise<void> {
        const dockerfile: FileActivityAttributes = {
            name: 'Dockerfile',
            description: 'A Dockerfile from the user\'s VS Code workspace that was used to build the project.',
            path: dockerfilePath,
            content: await AzExtFsExtra.readFile(dockerfilePath),
        };

        context.activityAttributes ??= {};
        context.activityAttributes.files ??= [];
        context.activityAttributes.files.push(dockerfile);
    }

    // Todo: Add goback logic for removing dockerfile from attributes
}
