/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { validateUtils } from "../../../utils/validateUtils";
import { ISecretContext } from "../ISecretContext";

export class SecretNameStep extends AzureWizardPromptStep<ISecretContext> {
    public async prompt(context: ISecretContext): Promise<void> {
        context.secretName = await context.ui.showInputBox({
            prompt: localize('secretName', 'Enter a secret key name.'),
            validateInput: this.validateInput
        });
    }

    public shouldPrompt(context: ISecretContext): boolean {
        return !context.secretName;
    }

    private validateInput(val: string | undefined): string | undefined {
        val = val ? val.trim() : '';

        if (!validateUtils.isValidLength(val)) {
            return validateUtils.getInvalidLengthMessage();
        }

        return undefined;
    }
}
