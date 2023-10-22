/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, nonNullValue } from '@microsoft/vscode-azext-utils';
import { dockerfileGlobPattern } from "../../../../constants";
import { localize } from '../../../../utils/localize';
import { selectWorkspaceFile } from "../../../../utils/workspaceUtils";
import type { IBuildImageInAzureContext } from "./IBuildImageInAzureContext";

export class DockerFileItemStep extends AzureWizardPromptStep<IBuildImageInAzureContext> {
    public async prompt(context: IBuildImageInAzureContext): Promise<void> {
        context.dockerfilePath = nonNullValue(await selectWorkspaceFile(context, localize('dockerFilePick', 'Select a Dockerfile'), { filters: {} }, `**/${dockerfileGlobPattern}`));
    }

    public shouldPrompt(context: IBuildImageInAzureContext): boolean {
        return !context.dockerfilePath;
    }
}
