/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { validateUtils } from "../../../utils/validateUtils";
import type { ISecretContext } from "../ISecretContext";

export class SecretValueStep extends AzureWizardPromptStep<ISecretContext> {
    public async prompt(context: ISecretContext): Promise<void> {
        context.secretValue = await context.ui.showInputBox({
            prompt: localize('secretValue', 'Enter a secret value.'),
            validateInput: this.validateInput
        });
        context.valuesToMask.push(context.secretValue);
    }

    public shouldPrompt(context: ISecretContext): boolean {
        return !context.secretValue;
    }

    private validateInput(val: string | undefined): string | undefined {
        val = val ? val.trim() : '';

        if (!validateUtils.isValidLength(val)) {
            return validateUtils.getInvalidLengthMessage();
        }

        return undefined;
    }
}
