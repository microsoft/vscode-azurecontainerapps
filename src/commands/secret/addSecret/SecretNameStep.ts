/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Secret } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import { validationUtils, type ValidAlphanumericAndSymbolsOptions } from "../../../utils/validationUtils";
import { type ISecretContext } from "../ISecretContext";

export class SecretNameStep extends AzureWizardPromptStep<ISecretContext> {
    public async prompt(context: ISecretContext): Promise<void> {
        context.newSecretName = (await context.ui.showInputBox({
            prompt: localize('secretName', 'Enter a secret name.'),
            validateInput: (val: string | undefined) => this.validateInput(context, val),
        })).trim();
        context.valuesToMask.push(context.newSecretName);
    }

    public shouldPrompt(context: ISecretContext): boolean {
        return !context.newSecretName;
    }

    private validateInput(context: ISecretContext, val: string | undefined): string | undefined {
        const value: string = val ? val.trim() : '';

        if (!validationUtils.hasValidCharLength(value)) {
            return validationUtils.getInvalidCharLengthMessage();
        }

        const options: ValidAlphanumericAndSymbolsOptions = { allowedSymbols: '-', allowSymbolRepetition: true, allowedAlphabetCasing: 'lowercase' };
        if (!validationUtils.hasValidAlphanumericAndSymbols(value, options)) {
            return validationUtils.getInvalidAlphanumericAndSymbolsMessage(options);
        }

        const secrets: Secret[] = context.containerApp?.configuration?.secrets ?? [];
        if (secrets.some((secret) => secret.name?.trim().toLocaleLowerCase() === value.toLocaleLowerCase())) {
            return localize('secretAlreadyExists', 'Secret with name "{0}" already exists.', value);
        }

        return undefined;
    }
}
