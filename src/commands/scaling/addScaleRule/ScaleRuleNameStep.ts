/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { localize } from '../../../utils/localize';
import { validateUtils } from '../../../utils/validateUtils';
import type { IAddScaleRuleContext } from './IAddScaleRuleContext';

export class ScaleRuleNameStep extends AzureWizardPromptStep<IAddScaleRuleContext> {
    public hideStepCount: boolean = true;

    public async prompt(context: IAddScaleRuleContext): Promise<void> {
        context.ruleName = (await context.ui.showInputBox({
            prompt: localize('scaleRuleNamePrompt', 'Enter a name for the new scale rule.'),
            validateInput: (name: string | undefined) => this.validateInput(context, name)
        })).trim();
    }

    public shouldPrompt(context: IAddScaleRuleContext): boolean {
        return !context.ruleName;
    }

    private validateInput(context: IAddScaleRuleContext, name: string | undefined): string | undefined {
        name = name ? name.trim() : '';

        if (!validateUtils.hasValidCharLength(name)) {
            return validateUtils.getInvalidCharLengthMessage();
        }

        if (!validateUtils.isLowerCaseAlphanumericWithSymbols(name)) {
            return validateUtils.getInvalidLowerCaseAlphanumericWithSymbolsMessage();
        }

        const scaleRuleExists: boolean = !!context.scaleRules?.some((rule) => {
            return rule.name?.length && rule.name === name;
        });

        if (scaleRuleExists) {
            return localize('scaleRuleExists', 'The scale rule "{0}" already exists in container app "{1}".', name, context.containerApp.name);
        }

        return undefined;
    }
}
