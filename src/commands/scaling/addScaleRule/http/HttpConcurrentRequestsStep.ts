/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../utils/localize';
import type { IAddScaleRuleContext } from '../IAddScaleRuleContext';
import { PositiveRealNumberBaseStep } from '../PositiveRealNumberBaseStep';

export class HttpConcurrentRequestsStep extends PositiveRealNumberBaseStep {
    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        context.newHttpConcurrentRequests = (await context.ui.showInputBox({
            prompt: localize('concurrentRequestsPrompt', 'Enter the number of concurrent requests.'),
            validateInput: this.validateInput
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return !context.newHttpConcurrentRequests;
    }
}

