/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';
import { PositiveRealNumberStep } from '../PositiveRealNumberStep';

export class QueueLengthStep extends PositiveRealNumberStep {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.queueProps.length = Number((await context.ui.showInputBox({
            prompt: localize('queueLengthPrompt', 'Enter a queue length.'),
            validateInput: async (value: string | undefined): Promise<string | undefined> => this.validateInput(value)
        })).trim());
    }

    public shouldPrompt(context: IAddScaleRuleWizardContext): boolean {
        return context.queueProps.length === undefined;
    }
}

