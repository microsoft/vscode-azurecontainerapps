/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../utils/localize';
import { IAddScaleRuleWizardContext } from '../IAddScaleRuleWizardContext';
import { PositiveRealNumberBaseStep } from '../PositiveRealNumberBaseStep';

export class HttpConcurrentRequestsStep extends PositiveRealNumberBaseStep {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        context.httpProps.concurrentRequests = (await context.ui.showInputBox({
            prompt: localize('concurrentRequestsPrompt', 'Enter the number of concurrent requests.'),
            validateInput: (value: string | undefined): string | undefined => this.validateInput(value)
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleWizardContext): boolean {
        return context.httpProps.concurrentRequests === undefined;
    }
}

