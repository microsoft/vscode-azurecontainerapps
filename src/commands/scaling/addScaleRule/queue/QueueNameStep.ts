/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../../utils/localize';
import { validateUtils } from '../../../../utils/validateUtils';
import type { IAddScaleRuleContext } from '../IAddScaleRuleContext';

export class QueueNameStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        context.queueName = (await context.ui.showInputBox({
            prompt: localize('queueNamePrompt', 'Enter a name for the queue.'),
            validateInput: (value: string | undefined): string | undefined => this.validateInput(value)
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return !context.queueName;
    }

    private validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';

        if (!validateUtils.hasValidCharLength(name)) {
            return validateUtils.getInvalidCharLengthMessage();
        }

        return undefined;
    }
}

