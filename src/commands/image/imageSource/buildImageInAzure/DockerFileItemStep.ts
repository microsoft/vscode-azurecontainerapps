/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullValue } from '@microsoft/vscode-azext-utils';
import { dockerFilePick, dockerfileGlobPattern } from "../../../../constants";
import { selectWorkspaceFile } from "../../../../utils/workspaceUtils";
import { BuildImageInAzureImageSourceContext } from './BuildImageInAzureContext';

export class DockerFileItemStep extends AzureWizardPromptStep<BuildImageInAzureImageSourceContext> {
    public async prompt(context: BuildImageInAzureImageSourceContext): Promise<void> {
        context.dockerfilePath = nonNullValue(await selectWorkspaceFile(context, dockerFilePick, { filters: {} }, `**/${dockerfileGlobPattern}`));
    }

    public shouldPrompt(context: BuildImageInAzureImageSourceContext): boolean {
        return !context.dockerfilePath;
    }
}
