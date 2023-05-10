/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { validateUtils } from "../../../utils/validateUtils";
import type { IConnectToGitHubContext } from "./IConnectToGitHubContext";

export class ServicePrincipalSecretInputStep extends AzureWizardPromptStep<IConnectToGitHubContext> {
    public async prompt(context: IConnectToGitHubContext): Promise<void> {
        context.servicePrincipalSecret = (await context.ui.showInputBox({
            prompt: localize('servicePrincipalSecretPrompt', 'Enter the service principal secret'),
            validateInput: this.validateInput
        })).trim();
        context.valuesToMask.push(context.servicePrincipalSecret);
    }

    public shouldPrompt(context: IConnectToGitHubContext): boolean {
        return !context.servicePrincipalSecret;
    }

    private validateInput(secret: string): string | undefined {
        secret = secret ? secret.trim() : '';
        return !validateUtils.isValidLength(secret) ? validateUtils.getInvalidLengthMessage() : undefined;
    }
}
