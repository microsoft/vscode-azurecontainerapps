/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class QueueLengthStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.queueLength = Number((await context.ui.showInputBox({
            prompt: localize('queueLengthPrompt', 'Enter a queue length.'),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).trim());
    }

    public shouldPrompt(): boolean {
        return true;
    }

    private async validateInput(length: string | undefined): Promise<string | undefined> {
        length = length ? length.trim() : '';

        const thirtyTwoBitMaxSafeInteger = 2147483647;
        if (!/^[1-9]+[0-9]*$/.test(length)) {
            return localize('invalidQueueLength', 'The number of requests must be a whole number greater than or equal to 1.');
        }
        if (Number(length) > thirtyTwoBitMaxSafeInteger) {
            return localize('numberTooLarge', 'The number entered is too large.');
        }
        return undefined;
    }
}

