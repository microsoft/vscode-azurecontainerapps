/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../../../utils/localize';
import { type IAddScaleRuleContext } from '../IAddScaleRuleContext';

export class QueueAuthTriggerStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        context.newQueueTriggerParameter = (await context.ui.showInputBox({
            prompt: localize('queueAuthTriggerPrompt', 'Enter a corresponding trigger parameter.'),
            validateInput: this.validateInput
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return !context.newQueueTriggerParameter;
    }

    private validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';
        if (!name.length) {
            return localize('fieldRequired', 'The field is required.');
        }
        return undefined;
    }
}
