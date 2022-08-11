/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IWizardOptions } from '@microsoft/vscode-azext-utils';
import { QuickPickItem } from 'vscode';
import { ScaleRuleTypes } from '../../../constants';
import { localize } from '../../../utils/localize';
import { HttpConcurrentRequestsStep } from './http/HttpConcurrentRequestsStep';
import { IAddScaleRuleWizardContext } from './IAddScaleRuleWizardContext';
import { QueueAuthSecretStep } from './queue/QueueAuthSecretStep';
import { QueueAuthTriggerStep } from './queue/QueueAuthTriggerStep';
import { QueueLengthStep } from './queue/QueueLengthStep';
import { QueueNameStep } from './queue/QueueNameStep';

export class ScaleRuleTypeStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        const placeHolder: string = localize('chooseScaleType', 'Choose scale type');
        const qpItems: QuickPickItem[] = Object.values(ScaleRuleTypes).map(type => { return { label: type } });
        context.ruleType = (await context.ui.showQuickPick(qpItems, { placeHolder })).label;
    }

    public shouldPrompt(context: IAddScaleRuleWizardContext): boolean {
        return context.ruleType === undefined;
    }

    public async getSubWizard(context: IAddScaleRuleWizardContext): Promise<IWizardOptions<IAddScaleRuleWizardContext>> {
        const promptSteps: AzureWizardPromptStep<IAddScaleRuleWizardContext>[] = [];
        switch (context.ruleType) {
            case ScaleRuleTypes.HTTP:
                promptSteps.push(new HttpConcurrentRequestsStep());
                break;
            case ScaleRuleTypes.Queue:
                promptSteps.push(
                    new QueueNameStep(),
                    new QueueLengthStep(),
                    new QueueAuthSecretStep(),
                    new QueueAuthTriggerStep()
                );
                break;
            default:
        }
        return { promptSteps };
    }
}

