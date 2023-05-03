/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { validateUtils } from "../../utils/validateUtils";
import type { IConnectToGitHubContext } from "./IConnectToGitHubContext";

export class DockerfileLocationInputStep extends AzureWizardPromptStep<IConnectToGitHubContext> {
    public async prompt(context: IConnectToGitHubContext): Promise<void> {
        context.dockerfilePath = (await context.ui.showInputBox({
            value: './Dockerfile',
            prompt: localize('dockerfileLocationPrompt', "Enter the relative location of the Dockerfile in the repository."),
            validateInput: this.validateInput
        })).trim();
    }

    public shouldPrompt(context: IConnectToGitHubContext): boolean {
        return !context.dockerfilePath;
    }

    private validateInput(dockerfilePath: string): string | undefined {
        dockerfilePath = dockerfilePath ? dockerfilePath.trim() : '';
        return !validateUtils.isValidLength(dockerfilePath) ? validateUtils.getInvalidLengthMessage() : undefined;
    }
}
