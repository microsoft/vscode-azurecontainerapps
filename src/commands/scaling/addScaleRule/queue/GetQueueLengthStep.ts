/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class GetQueueLengthStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.queueLength = (await context.ui.showInputBox({
            prompt: localize('queueLengthPrompt', 'Enter concurrent requests.'),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).trim();
    }

    public shouldPrompt(): boolean {
        return true;
    }

    private async validateInput(requests: string | undefined): Promise<string | undefined> {
        requests = requests ? requests.trim() : '';

        if (!/^[1-9]+[0-9]*$/.test(requests)) {
            return localize('invalidQueueLength', 'The number of requests must be a whole number greater than or equal to 1.');
        }
        return undefined;
    }
}

