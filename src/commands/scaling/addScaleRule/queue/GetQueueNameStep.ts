/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ScaleRule } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';

export class GetQueueNameStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    containerApp: ContainerApp | undefined;
    scaleRules: ScaleRule[] | undefined;

    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.queueName = (await context.ui.showInputBox({
            prompt: localize('queueNamePrompt', 'Enter a name for the queue.'),
            validateInput: async (value: string | undefined): Promise<string | undefined> => await this.validateInput(value)
        })).trim();
    }

    public shouldPrompt(): boolean {
        return true;
    }

    private async validateInput(name: string | undefined): Promise<string | undefined> {
        name = name ? name.trim() : '';
        if (!/^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
            return localize('invalidChar', `A name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character.`);
        }
        return undefined;
    }
}

