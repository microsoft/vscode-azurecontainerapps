/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../utils/localize";
import { validateUtils } from "../../utils/validateUtils";
import { IConnectToGitHubContext } from "./IConnectToGitHubContext";

export class ServicePrincipalIdInputStep extends AzureWizardPromptStep<IConnectToGitHubContext> {
    public async prompt(context: IConnectToGitHubContext): Promise<void> {
        const prompt: string = localize('servicePrincipalIdPrompt', 'Enter the service principal ID');
        context.servicePrincipalId = (await context.ui.showInputBox({ prompt, validateInput: this.validateInput })).trim();
        context.valuesToMask.push(context.servicePrincipalId);
    }

    public shouldPrompt(context: IConnectToGitHubContext): boolean {
        return !context.servicePrincipalId;
    }

    private validateInput(id: string): string | undefined {
        id = id ? id.trim() : '';
        return !validateUtils.isValidLength(id) ? validateUtils.getInvalidLengthMessage() : undefined;
    }
}
