/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../utils/localize';
import type { IAddScaleRuleContext } from '../IAddScaleRuleContext';
import { PositiveWholeNumberBaseStep } from '../PositiveRealNumberBaseStep';

export class QueueLengthStep extends PositiveWholeNumberBaseStep {
    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        context.queueLength = Number((await context.ui.showInputBox({
            prompt: localize('queueLengthPrompt', 'Enter a queue length.'),
            validateInput: this.validateInput
        })).trim());
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return !context.queueLength;
    }
}

