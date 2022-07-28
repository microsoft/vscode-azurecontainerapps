/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';
import { PositiveRealNumberBaseStep } from '../PositiveRealNumberBaseStep';

export class QueueLengthStep extends PositiveRealNumberBaseStep {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.queueProps.length = Number((await context.ui.showInputBox({
            prompt: localize('queueLengthPrompt', 'Enter a queue length.'),
            validateInput: (value: string | undefined): string | undefined => this.validateInput(value)
        })).trim());
    }

    public shouldPrompt(context: IAddScaleRuleWizardContext): boolean {
        return context.queueProps.length === undefined;
    }
}

