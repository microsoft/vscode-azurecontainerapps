/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class QueueAuthTriggerStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.triggerParameter = (await context.ui.showInputBox({
            prompt: localize('queueAuthTriggerPrompt', 'Enter a corresponding trigger parameter.'),
            validateInput: (value: string | undefined): string | undefined => this.validateInput(value)
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleWizardContext): boolean {
        return context.triggerParameter === undefined;
    }

    private validateInput(name: string | undefined): string | undefined {
        name = name ? name.trim() : '';
        if (!name.length) {
            return localize('fieldRequired', 'The field is required.');
        }
        return undefined;
    }
}
