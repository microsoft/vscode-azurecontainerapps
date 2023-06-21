/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaleRule } from '@azure/arm-appcontainers';
import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../utils/localize';
import { IAddScaleRuleContext } from './IAddScaleRuleContext';

export class ScaleRuleNameStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        context.ruleName = (await context.ui.showInputBox({
            prompt: localize('scaleRuleNamePrompt', 'Enter a name for the new scale rule.'),
            validateInput: (name: string | undefined): string | undefined => {
                return validateScaleRuleInput(name, context.containerApp?.name, context.scaleRules);
            }
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return context.ruleName === undefined;
    }
}

function validateScaleRuleInput(name: string | undefined, containerAppName: string, scaleRules: ScaleRule[]): string | undefined {
    name = name ? name.trim() : '';

    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
        return localize('invalidChar', `A name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character.`);
    }

    const scaleRuleExists: boolean = !!scaleRules?.some((rule) => {
        return rule?.name?.length && rule?.name === name;
    });
    if (scaleRuleExists) {
        return localize('scaleRuleExists', 'The scale rule "{0}" already exists in container app "{1}". Please enter a unique name.', name, containerAppName);
    }
    return undefined;
}
