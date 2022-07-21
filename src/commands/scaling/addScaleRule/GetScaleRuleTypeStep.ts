/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IWizardOptions } from '@microsoft/vscode-azext-utils';
import { QuickPickItem } from 'vscode';
import { ScaleRuleTypes } from '../../../constants';
import { GetConcurrentRequestsStep } from './http/GetConcurrentRequestsStep';
import { IAddScaleRuleWizardContext } from './IAddScaleRuleWizardContext';
import { GetQueueNameStep } from './queue/GetQueueNameStep';

export class GetScaleRuleTypeStep extends AzureWizardPromptStep<IAddScaleRuleWizardContext> {
    public async prompt(context: IAddScaleRuleWizardContext): Promise<void> {
        const qpItems: QuickPickItem[] = [];
        for (const ruleType in ScaleRuleTypes) { qpItems.push({ label: ScaleRuleTypes[ruleType as keyof typeof ScaleRuleTypes] }); }
        context.ruleType = (await context.ui.showQuickPick(qpItems, {})).label;
    }

    public shouldPrompt(): boolean {
        return true;
    }

    public async getSubWizard(context: IAddScaleRuleWizardContext): Promise<IWizardOptions<IAddScaleRuleWizardContext>> {
        const promptSteps: AzureWizardPromptStep<IAddScaleRuleWizardContext>[] = [];
        switch (context.ruleType) {
            case ScaleRuleTypes.HTTP:
                promptSteps.push(new GetConcurrentRequestsStep());
                break;
            case ScaleRuleTypes.Queue:
                promptSteps.push(new GetQueueNameStep());
                break;
        }
        return { promptSteps };
    }
}

