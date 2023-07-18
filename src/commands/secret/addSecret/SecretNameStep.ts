/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Secret } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { validateUtils } from "../../../utils/validateUtils";
import type { ISecretContext } from "../ISecretContext";

export class SecretNameStep extends AzureWizardPromptStep<ISecretContext> {
    public async prompt(context: ISecretContext): Promise<void> {
        context.secretName = await context.ui.showInputBox({
            prompt: localize('secretName', 'Enter a secret name.'),
            validateInput: this.validateInput,
            asyncValidationTask: (val: string) => this.validateUniqueSecret(context, val)
        });
        context.valuesToMask.push(context.secretName);
    }

    public shouldPrompt(context: ISecretContext): boolean {
        return !context.secretName;
    }

    private validateInput(val: string | undefined): string | undefined {
        val = val ? val.trim() : '';

        if (!validateUtils.isValidLength(val)) {
            return validateUtils.getInvalidLengthMessage();
        }

        const allowedSymbols: string = '-.';
        if (!validateUtils.isLowerCaseAlphanumericWithSymbols(val, allowedSymbols)) {
            return validateUtils.getInvalidLowerCaseAlphanumericWithSymbolsMessage(allowedSymbols);
        }

        return undefined;
    }

    private async validateUniqueSecret(context: ISecretContext, val: string): Promise<string | undefined> {
        val = val.trim();

        const secrets: Secret[] = context.containerApp?.configuration?.secrets ?? [];
        if (secrets.some((secret) => secret.name?.trim().toLocaleLowerCase() === val.toLocaleLowerCase())) {
            return localize('secretAlreadyExists', 'Secret with name "{0}" already exists.', val);
        }

        return undefined;
    }
}
