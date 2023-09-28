/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import type { ScaleRule } from "@azure/arm-appcontainers";
import { AzureWizardPromptStep, IAzureQuickPickItem, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { localize } from "../../../utils/localize";
import type { ScaleRuleContext } from "./ScaleRuleContext";

export class ScaleRuleListStep extends AzureWizardPromptStep<ScaleRuleContext> {
    public async prompt(context: ScaleRuleContext): Promise<void> {
        context.scaleRule = (await context.ui.showQuickPick(this.getPicks(context), { placeHolder: localize('scaleRule', 'Select a scale rule') })).data;
    }

    public shouldPrompt(context: ScaleRuleContext): boolean {
        return !context.scaleRule;
    }

    private async getPicks(context: ScaleRuleContext): Promise<IAzureQuickPickItem<ScaleRule>[] | undefined> {
        const scaleRules = context.containerApp?.template?.scale?.rules;
        if (!scaleRules?.length) {
            throw new Error(localize('noScaleRules', 'No scale rules found'));
        }
        else {
            return scaleRules?.map(r => {
                return {
                    label: nonNullProp(r, 'name'),
                    data: nonNullValue(r)
                }
            })
        }
    }
}
