/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ScaleRule } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class QueueNameStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    containerApp: ContainerApp | undefined;
    scaleRules: ScaleRule[] | undefined;

    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.queueProps.name = (await context.ui.showInputBox({
            prompt: localize('queueNamePrompt', 'Enter a name for the queue.'),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleWizardContext): boolean {
        return context.queueProps.name === undefined;
    }

    private async validateInput(name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';
        if (!name.length) {
            return localize('fieldRequired', 'The field is required.');
        }
        return undefined;
    }
}

