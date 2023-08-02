/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../../utils/localize';
import { validateUtils } from '../../../../utils/validateUtils';
import type { IAddScaleRuleContext } from '../IAddScaleRuleContext';

export class QueueAuthTriggerStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        context.triggerParameter = (await context.ui.showInputBox({
            prompt: localize('queueAuthTriggerPrompt', 'Enter a corresponding trigger parameter.'),
            validateInput: this.validateInput
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return !context.triggerParameter;
    }

    private validateInput(value: string | undefined): string | undefined {
        value = value ? value.trim() : '';

        if (!validateUtils.hasValidCharLength(value)) {
            return validateUtils.getInvalidCharLengthMessage();
        }

        return undefined;
    }
}
